import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

/**
 * Rate limiting with Upstash Redis
 * Falls back to in-memory when Upstash is not configured
 */

// Check if Upstash is configured
const UPSTASH_CONFIGURED = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
)

// Initialize Redis client if configured
const redis = UPSTASH_CONFIGURED
  ? Redis.fromEnv()
  : null

/**
 * Rate limit tiers for different API endpoints
 */
export const RateLimitTiers = {
  // Standard API endpoints (most routes)
  standard: {
    requests: 60,
    window: '1 m' as const,
    identifier: 'standard'
  },
  // Authentication endpoints (login, signup)
  auth: {
    requests: 10,
    window: '1 m' as const,
    identifier: 'auth'
  },
  // Sensitive operations (payments, provisioning)
  sensitive: {
    requests: 10,
    window: '1 m' as const,
    identifier: 'sensitive'
  },
  // Webhook endpoints (higher limit for external services)
  webhook: {
    requests: 200,
    window: '1 m' as const,
    identifier: 'webhook'
  },
  // Strict limit for expensive operations (AI calls, test calls)
  strict: {
    requests: 5,
    window: '1 m' as const,
    identifier: 'strict'
  },
  // Daily cap for expensive public endpoints (TTS, voice preview)
  daily: {
    requests: 100,
    window: '1 d' as const,
    identifier: 'daily'
  }
} as const

export type RateLimitTier = keyof typeof RateLimitTiers

// Window types for Upstash
export type RateLimitWindow = '1 s' | '1 m' | '1 h' | '1 d'

// Create Upstash rate limiters for each tier
const upstashLimiters = UPSTASH_CONFIGURED && redis ? {
  standard: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(RateLimitTiers.standard.requests, RateLimitTiers.standard.window),
    analytics: true,
    prefix: 'voicefly:rl:standard'
  }),
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(RateLimitTiers.auth.requests, RateLimitTiers.auth.window),
    analytics: true,
    prefix: 'voicefly:rl:auth'
  }),
  sensitive: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(RateLimitTiers.sensitive.requests, RateLimitTiers.sensitive.window),
    analytics: true,
    prefix: 'voicefly:rl:sensitive'
  }),
  webhook: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(RateLimitTiers.webhook.requests, RateLimitTiers.webhook.window),
    analytics: true,
    prefix: 'voicefly:rl:webhook'
  }),
  strict: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(RateLimitTiers.strict.requests, RateLimitTiers.strict.window),
    analytics: true,
    prefix: 'voicefly:rl:strict'
  }),
  daily: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(RateLimitTiers.daily.requests, RateLimitTiers.daily.window),
    analytics: true,
    prefix: 'voicefly:rl:daily'
  })
} : null

/**
 * In-memory fallback rate limiter
 * Used when Upstash is not configured (development)
 */
interface RateLimitStore {
  [key: string]: number[]
}

const memoryStore: RateLimitStore = {}

// Cleanup old entries every 5 minutes to prevent memory leak
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    Object.keys(memoryStore).forEach(key => {
      memoryStore[key] = memoryStore[key].filter(time => now - time < 60000)
      if (memoryStore[key].length === 0) {
        delete memoryStore[key]
      }
    })
  }, 300000)
}

function memoryRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number; reset: number } {
  const now = Date.now()

  if (!memoryStore[identifier]) {
    memoryStore[identifier] = []
  }

  memoryStore[identifier] = memoryStore[identifier].filter(
    time => now - time < windowMs
  )

  const requestCount = memoryStore[identifier].length

  if (requestCount >= limit) {
    const oldestRequest = memoryStore[identifier][0]
    return {
      success: false,
      remaining: 0,
      reset: oldestRequest + windowMs
    }
  }

  memoryStore[identifier].push(now)

  return {
    success: true,
    remaining: limit - requestCount - 1,
    reset: now + windowMs
  }
}

/**
 * Rate limit result type
 */
export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

/**
 * Check rate limit for an identifier
 * Uses Upstash in production, falls back to in-memory in development
 */
export async function checkRateLimit(
  identifier: string,
  tier: RateLimitTier = 'standard'
): Promise<RateLimitResult> {
  const tierConfig = RateLimitTiers[tier]
  const key = `${tierConfig.identifier}:${identifier}`

  // Use Upstash if configured
  if (upstashLimiters) {
    const limiter = upstashLimiters[tier]
    const result = await limiter.limit(key)

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset
    }
  }

  // Fallback to in-memory
  const windowMs = parseWindow(tierConfig.window)
  const result = memoryRateLimit(key, tierConfig.requests, windowMs)

  return {
    success: result.success,
    limit: tierConfig.requests,
    remaining: result.remaining,
    reset: result.reset
  }
}

/**
 * Parse window string to milliseconds
 */
function parseWindow(window: string): number {
  const match = window.match(/^(\d+)\s*(s|m|h|d)$/)
  if (!match) return 60000 // Default 1 minute

  const value = parseInt(match[1])
  const unit = match[2]

  switch (unit) {
    case 's': return value * 1000
    case 'm': return value * 60 * 1000
    case 'h': return value * 60 * 60 * 1000
    case 'd': return value * 24 * 60 * 60 * 1000
    default: return 60000
  }
}

/**
 * Get IP address from request
 * Works with Vercel, Cloudflare, and standard setups
 */
export function getClientIp(headers: Headers): string {
  // Vercel
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  // Cloudflare
  const cfConnectingIp = headers.get('cf-connecting-ip')
  if (cfConnectingIp) {
    return cfConnectingIp
  }

  // Real IP
  const realIp = headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  return '127.0.0.1'
}

/**
 * Check if Upstash is configured
 */
export function isUpstashConfigured(): boolean {
  return UPSTASH_CONFIGURED
}
