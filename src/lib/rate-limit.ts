import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

/**
 * Production-ready rate limiting with Upstash Redis
 * Falls back to in-memory rate limiting for development
 */

// Initialize Redis client for production
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

// Create different rate limiters for different use cases
export const rateLimiters = {
  // Strict rate limit for auth endpoints (5 requests per minute)
  auth: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '1 m'),
        analytics: true,
        prefix: 'ratelimit:auth',
      })
    : null,

  // API rate limit (100 requests per minute)
  api: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, '1 m'),
        analytics: true,
        prefix: 'ratelimit:api',
      })
    : null,

  // Payment endpoints (10 requests per minute)
  payment: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '1 m'),
        analytics: true,
        prefix: 'ratelimit:payment',
      })
    : null,

  // Webhook endpoints (1000 requests per minute - higher for legitimate webhooks)
  webhook: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(1000, '1 m'),
        analytics: true,
        prefix: 'ratelimit:webhook',
      })
    : null,

  // SMS sending (30 per minute to prevent spam)
  sms: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(30, '1 m'),
        analytics: true,
        prefix: 'ratelimit:sms',
      })
    : null,
}

/**
 * Rate limit helper function for API routes
 * Returns true if request should be allowed, false if rate limited
 */
export async function checkRateLimit(
  identifier: string,
  limiterType: keyof typeof rateLimiters = 'api'
): Promise<{ success: boolean; remaining?: number; reset?: number }> {
  const limiter = rateLimiters[limiterType]

  // If Redis is not configured, fall back to in-memory rate limiter
  if (!limiter) {
    console.warn(`Rate limiting using in-memory fallback (${limiterType})`)
    return inMemoryRateLimit(identifier, limiterType)
  }

  try {
    const { success, limit, reset, remaining } = await limiter.limit(identifier)

    return {
      success,
      remaining,
      reset,
    }
  } catch (error) {
    console.error('Upstash rate limit check failed:', error)
    // On error, fall back to in-memory
    return inMemoryRateLimit(identifier, limiterType)
  }
}

/**
 * Get rate limit identifier from request
 * Uses IP address or user ID if authenticated
 */
export function getRateLimitIdentifier(request: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`
  }

  const ip = getClientIp(request.headers)
  return `ip:${ip}`
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

// ============================================================================
// In-Memory Rate Limiter Fallback (Development/Backup)
// ============================================================================

interface RateLimitStore {
  [key: string]: number[]
}

const requests: RateLimitStore = {}

// Cleanup old entries every 5 minutes to prevent memory leak
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    Object.keys(requests).forEach(key => {
      requests[key] = requests[key].filter(time => now - time < 60000)
      if (requests[key].length === 0) {
        delete requests[key]
      }
    })
  }, 300000)
}

const RATE_LIMIT_CONFIGS = {
  auth: { limit: 5, window: 60000 }, // 5 per minute
  api: { limit: 100, window: 60000 }, // 100 per minute
  payment: { limit: 10, window: 60000 }, // 10 per minute
  webhook: { limit: 1000, window: 60000 }, // 1000 per minute
  sms: { limit: 30, window: 60000 }, // 30 per minute
}

function inMemoryRateLimit(
  identifier: string,
  limiterType: keyof typeof rateLimiters
): { success: boolean; remaining?: number; reset?: number } {
  const now = Date.now()
  const config = RATE_LIMIT_CONFIGS[limiterType]

  if (!config) {
    return { success: true }
  }

  const { limit, window } = config

  // Get or create request history for this identifier
  if (!requests[identifier]) {
    requests[identifier] = []
  }

  // Filter requests within the time window
  requests[identifier] = requests[identifier].filter(
    time => now - time < window
  )

  const requestCount = requests[identifier].length

  if (requestCount >= limit) {
    // Rate limit exceeded
    const oldestRequest = requests[identifier][0]
    const reset = oldestRequest + window

    return {
      success: false,
      remaining: 0,
      reset
    }
  }

  // Add current request
  requests[identifier].push(now)

  return {
    success: true,
    remaining: limit - requestCount - 1,
    reset: now + window
  }
}
