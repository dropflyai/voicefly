/**
 * Gmail Service
 *
 * Handles email operations using the Google Service Account with domain-wide delegation.
 * Impersonates tony@dropfly.io to send/read/manage emails across all DropFly aliases.
 *
 * Service account: voicefly-calendar@voice-fly.iam.gserviceaccount.com
 * Scopes: gmail.send, gmail.readonly, gmail.modify
 */

import { google, gmail_v1 } from 'googleapis'

const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
const SERVICE_ACCOUNT_PRIVATE_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n')

const DEFAULT_IMPERSONATE_EMAIL = 'tony@dropfly.io'

// --- Auth ---

function getGmailClient(impersonateEmail?: string): gmail_v1.Gmail {
  if (!SERVICE_ACCOUNT_EMAIL || !SERVICE_ACCOUNT_PRIVATE_KEY) {
    throw new Error('Gmail not configured: GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY are required')
  }

  const auth = new google.auth.JWT({
    email: SERVICE_ACCOUNT_EMAIL,
    key: SERVICE_ACCOUNT_PRIVATE_KEY,
    scopes: [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify',
    ],
    subject: impersonateEmail || DEFAULT_IMPERSONATE_EMAIL,
  })

  return google.gmail({ version: 'v1', auth })
}

// --- Helpers ---

/**
 * Base64url encode a string (RFC 4648, no padding)
 */
function base64urlEncode(str: string): string {
  return Buffer.from(str, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/**
 * Build a MIME message string
 */
function buildMimeMessage(params: {
  to: string | string[]
  subject: string
  body: string
  textBody?: string
  from?: string
  replyTo?: string
  cc?: string[]
  bcc?: string[]
  inReplyTo?: string
  references?: string
}): string {
  const to = Array.isArray(params.to) ? params.to.join(', ') : params.to
  const from = params.from || DEFAULT_IMPERSONATE_EMAIL
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`

  const headers: string[] = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${params.subject}`,
    `MIME-Version: 1.0`,
  ]

  if (params.cc?.length) {
    headers.push(`Cc: ${params.cc.join(', ')}`)
  }
  if (params.bcc?.length) {
    headers.push(`Bcc: ${params.bcc.join(', ')}`)
  }
  if (params.replyTo) {
    headers.push(`Reply-To: ${params.replyTo}`)
  }
  if (params.inReplyTo) {
    headers.push(`In-Reply-To: ${params.inReplyTo}`)
  }
  if (params.references) {
    headers.push(`References: ${params.references}`)
  }

  const textBody = params.textBody || params.body.replace(/<[^>]*>/g, '')

  headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`)

  const messageParts = [
    headers.join('\r\n'),
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    textBody,
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    params.body,
    `--${boundary}--`,
  ]

  return messageParts.join('\r\n')
}

/**
 * Extract a header value from a Gmail message
 */
function getHeader(headers: gmail_v1.Schema$MessagePartHeader[] | undefined, name: string): string {
  return headers?.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || ''
}

/**
 * Decode a base64url-encoded string from Gmail
 */
function decodeBase64url(data: string): string {
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/')
  return Buffer.from(base64, 'base64').toString('utf-8')
}

/**
 * Extract body content from a Gmail message payload
 */
function extractBody(payload: gmail_v1.Schema$MessagePart | undefined, mimeType: string): string {
  if (!payload) return ''

  // Direct body on the payload
  if (payload.mimeType === mimeType && payload.body?.data) {
    return decodeBase64url(payload.body.data)
  }

  // Search through parts (multipart/alternative, multipart/mixed, etc.)
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === mimeType && part.body?.data) {
        return decodeBase64url(part.body.data)
      }
      // Recurse into nested multipart
      if (part.parts) {
        const nested = extractBody(part, mimeType)
        if (nested) return nested
      }
    }
  }

  return ''
}

// --- Exported Functions ---

export async function sendEmail(params: {
  to: string | string[]
  subject: string
  body: string
  textBody?: string
  from?: string
  replyTo?: string
  cc?: string[]
  bcc?: string[]
  threadId?: string
}): Promise<{ messageId: string; threadId: string }> {
  try {
    const gmail = getGmailClient()
    const raw = base64urlEncode(buildMimeMessage(params))

    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw,
        threadId: params.threadId || undefined,
      },
    })

    if (!result.data.id) {
      throw new Error('Gmail API returned no message ID')
    }

    return {
      messageId: result.data.id,
      threadId: result.data.threadId || result.data.id,
    }
  } catch (error: any) {
    console.error('Gmail sendEmail error:', error)
    throw new Error(`Failed to send email: ${error.message || error}`)
  }
}

export async function readEmails(params?: {
  query?: string
  maxResults?: number
  labelIds?: string[]
}): Promise<Array<{
  id: string
  threadId: string
  from: string
  to: string
  subject: string
  snippet: string
  date: string
  isUnread: boolean
}>> {
  try {
    const gmail = getGmailClient()
    const maxResults = params?.maxResults || 20

    const listResult = await gmail.users.messages.list({
      userId: 'me',
      q: params?.query || undefined,
      maxResults,
      labelIds: params?.labelIds || undefined,
    })

    const messages = listResult.data.messages || []
    if (messages.length === 0) return []

    const results = await Promise.all(
      messages.map(async (msg) => {
        const detail = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id!,
          format: 'metadata',
          metadataHeaders: ['From', 'To', 'Subject', 'Date'],
        })

        const headers = detail.data.payload?.headers
        const labelIds = detail.data.labelIds || []

        return {
          id: detail.data.id!,
          threadId: detail.data.threadId!,
          from: getHeader(headers, 'From'),
          to: getHeader(headers, 'To'),
          subject: getHeader(headers, 'Subject'),
          snippet: detail.data.snippet || '',
          date: getHeader(headers, 'Date'),
          isUnread: labelIds.includes('UNREAD'),
        }
      })
    )

    return results
  } catch (error: any) {
    console.error('Gmail readEmails error:', error)
    throw new Error(`Failed to read emails: ${error.message || error}`)
  }
}

export async function getEmail(messageId: string): Promise<{
  id: string
  threadId: string
  from: string
  to: string
  subject: string
  body: string
  textBody: string
  date: string
  headers: Record<string, string>
}> {
  try {
    const gmail = getGmailClient()

    const result = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    })

    const payload = result.data.payload
    const allHeaders = payload?.headers || []

    const headers: Record<string, string> = {}
    for (const h of allHeaders) {
      if (h.name && h.value) {
        headers[h.name] = h.value
      }
    }

    const htmlBody = extractBody(payload, 'text/html')
    const textBody = extractBody(payload, 'text/plain')

    return {
      id: result.data.id!,
      threadId: result.data.threadId!,
      from: getHeader(allHeaders, 'From'),
      to: getHeader(allHeaders, 'To'),
      subject: getHeader(allHeaders, 'Subject'),
      body: htmlBody || textBody,
      textBody: textBody || htmlBody.replace(/<[^>]*>/g, ''),
      date: getHeader(allHeaders, 'Date'),
      headers,
    }
  } catch (error: any) {
    console.error('Gmail getEmail error:', error)
    throw new Error(`Failed to get email ${messageId}: ${error.message || error}`)
  }
}

export async function replyToEmail(params: {
  messageId: string
  body: string
  textBody?: string
}): Promise<{ messageId: string; threadId: string }> {
  try {
    const gmail = getGmailClient()
    const original = await getEmail(params.messageId)

    const subject = original.subject.startsWith('Re:')
      ? original.subject
      : `Re: ${original.subject}`

    const messageIdHeader = original.headers['Message-ID'] || original.headers['Message-Id'] || ''
    const existingRefs = original.headers['References'] || ''
    const references = existingRefs
      ? `${existingRefs} ${messageIdHeader}`
      : messageIdHeader

    const raw = base64urlEncode(buildMimeMessage({
      to: original.from,
      subject,
      body: params.body,
      textBody: params.textBody,
      inReplyTo: messageIdHeader,
      references,
    }))

    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw,
        threadId: original.threadId,
      },
    })

    if (!result.data.id) {
      throw new Error('Gmail API returned no message ID')
    }

    return {
      messageId: result.data.id,
      threadId: result.data.threadId || result.data.id,
    }
  } catch (error: any) {
    console.error('Gmail replyToEmail error:', error)
    throw new Error(`Failed to reply to email ${params.messageId}: ${error.message || error}`)
  }
}

export async function getThread(threadId: string): Promise<Array<{
  id: string
  from: string
  to: string
  subject: string
  body: string
  date: string
}>> {
  try {
    const gmail = getGmailClient()

    const result = await gmail.users.threads.get({
      userId: 'me',
      id: threadId,
      format: 'full',
    })

    const messages = result.data.messages || []

    return messages.map((msg) => {
      const headers = msg.payload?.headers || []
      const htmlBody = extractBody(msg.payload, 'text/html')
      const textBody = extractBody(msg.payload, 'text/plain')

      return {
        id: msg.id!,
        from: getHeader(headers, 'From'),
        to: getHeader(headers, 'To'),
        subject: getHeader(headers, 'Subject'),
        body: htmlBody || textBody,
        date: getHeader(headers, 'Date'),
      }
    })
  } catch (error: any) {
    console.error('Gmail getThread error:', error)
    throw new Error(`Failed to get thread ${threadId}: ${error.message || error}`)
  }
}

export async function markAsRead(messageId: string): Promise<void> {
  try {
    const gmail = getGmailClient()
    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: ['UNREAD'],
      },
    })
  } catch (error: any) {
    console.error('Gmail markAsRead error:', error)
    throw new Error(`Failed to mark email as read ${messageId}: ${error.message || error}`)
  }
}

export async function markAsUnread(messageId: string): Promise<void> {
  try {
    const gmail = getGmailClient()
    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        addLabelIds: ['UNREAD'],
      },
    })
  } catch (error: any) {
    console.error('Gmail markAsUnread error:', error)
    throw new Error(`Failed to mark email as unread ${messageId}: ${error.message || error}`)
  }
}

// Default gmail client instance for convenience
export const gmail = {
  send: sendEmail,
  read: readEmails,
  get: getEmail,
  reply: replyToEmail,
  thread: getThread,
  markAsRead,
  markAsUnread,
}

export default gmail
