import { NextRequest, NextResponse } from 'next/server'
import { trackOpen } from '@/lib/email-campaign-tracker'

// 1x1 transparent pixel
const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
)

export async function GET(req: NextRequest) {
  const cid = req.nextUrl.searchParams.get('cid')
  const email = req.nextUrl.searchParams.get('e')

  if (cid && email) {
    // Fire and forget — don't block the response
    trackOpen(cid, decodeURIComponent(email)).catch(() => {})
  }

  return new NextResponse(PIXEL, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  })
}
