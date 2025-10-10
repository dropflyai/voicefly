/**
 * Simple in-memory rate limiter
 * For production with multiple servers, use Upstash or Redis
 */

interface RateLimitStore {
  [key: string]: number[]
}

const requests: RateLimitStore = {}

// Cleanup old entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now()
  Object.keys(requests).forEach(key => {
    requests[key] = requests[key].filter(time => now - time < 60000)
    if (requests[key].length === 0) {
      delete requests[key]
    }
  })
}, 300000)

export interface RateLimitConfig {
  limit: number // Number of requests allowed
  window: number // Time window in milliseconds
}

export function rateLimit(
  identifier: string,
  config: RateLimitConfig = { limit: 10, window: 10000 }
): { success: boolean; remaining: number; reset: number } {
  const now = Date.now()
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
 * Upstash Rate Limiting (optional - requires setup)
 * Uncomment when Upstash is configured
 */

// import { Ratelimit } from '@upstash/ratelimit'
// import { Redis } from '@upstash/redis'

// export const upstashRateLimit = new Ratelimit({
//   redis: Redis.fromEnv(),
//   limiter: Ratelimit.slidingWindow(10, '10 s'),
//   analytics: true,
//   prefix: 'voicefly'
// })
