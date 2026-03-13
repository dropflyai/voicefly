/**
 * Production-safe logger
 *
 * In production: only warnings and errors are emitted (no info/debug).
 * In development: all levels are emitted.
 *
 * Usage:
 *   import { logger } from '@/lib/logger'
 *   logger.info('Payment processed', { paymentId: 'pi_123' })
 *   logger.error('Payment failed', error)
 */

const isProduction = process.env.NODE_ENV === 'production'

function formatMessage(level: string, message: string, data?: unknown): string {
  const timestamp = new Date().toISOString()
  const base = `[${timestamp}] [${level}] ${message}`
  if (data !== undefined) {
    try {
      return `${base} ${JSON.stringify(data)}`
    } catch {
      return `${base} [unserializable data]`
    }
  }
  return base
}

export const logger = {
  /** Debug-level: only in development */
  debug(message: string, data?: unknown) {
    if (!isProduction) {
      console.log(formatMessage('DEBUG', message, data))
    }
  },

  /** Info-level: only in development */
  info(message: string, data?: unknown) {
    if (!isProduction) {
      console.log(formatMessage('INFO', message, data))
    }
  },

  /** Warning-level: always emitted */
  warn(message: string, data?: unknown) {
    console.warn(formatMessage('WARN', message, data))
  },

  /** Error-level: always emitted */
  error(message: string, error?: unknown) {
    if (error instanceof Error) {
      console.error(formatMessage('ERROR', message, {
        message: error.message,
        stack: isProduction ? undefined : error.stack,
      }))
    } else {
      console.error(formatMessage('ERROR', message, error))
    }
  },
}

export default logger
