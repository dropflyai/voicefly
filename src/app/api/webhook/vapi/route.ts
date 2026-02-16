import { NextRequest, NextResponse } from 'next/server'

/**
 * DEPRECATED: Legacy VAPI Webhook Handler
 *
 * This endpoint is deprecated and forwards all requests to the new
 * multi-tenant webhook handler at /api/webhooks/vapi
 *
 * All new VAPI agent/phone configurations should use:
 * POST /api/webhooks/vapi
 */

export async function POST(request: NextRequest) {
  console.warn('⚠️ DEPRECATED: /api/webhook/vapi called - forwarding to /api/webhooks/vapi')

  // Get the request body
  const body = await request.json()

  // Get all headers from the original request
  const headers: Record<string, string> = {}
  request.headers.forEach((value, key) => {
    headers[key] = value
  })

  // Forward to the new endpoint
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  try {
    const response = await fetch(`${baseUrl}/api/webhooks/vapi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward the VAPI secret header if present
        ...(headers['x-vapi-secret'] && { 'x-vapi-secret': headers['x-vapi-secret'] }),
        ...(headers['x-vapi-signature'] && { 'x-vapi-signature': headers['x-vapi-signature'] })
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error forwarding to new webhook endpoint:', error)
    return NextResponse.json(
      { error: 'Webhook forwarding failed' },
      { status: 500 }
    )
  }
}
