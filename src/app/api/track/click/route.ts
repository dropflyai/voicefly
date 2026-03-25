import { NextRequest, NextResponse } from 'next/server'
import { trackClick } from '@/lib/email-campaign-tracker'

export async function GET(req: NextRequest) {
  const cid = req.nextUrl.searchParams.get('cid')
  const email = req.nextUrl.searchParams.get('e')
  const url = req.nextUrl.searchParams.get('url')

  if (cid && email && url) {
    const decodedUrl = decodeURIComponent(url)
    const decodedEmail = decodeURIComponent(email)

    // Track the click (fire and forget)
    trackClick(cid, decodedEmail, decodedUrl).catch(() => {})

    // Redirect to the actual URL
    return NextResponse.redirect(decodedUrl)
  }

  // Fallback — redirect to homepage
  return NextResponse.redirect(new URL('/', req.url))
}
