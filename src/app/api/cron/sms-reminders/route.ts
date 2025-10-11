import { NextRequest, NextResponse } from 'next/server'
import { SMSScheduler } from '@/lib/sms-scheduler'

/**
 * Cron Job API Route for SMS Reminders
 *
 * Set up cron jobs in Vercel/your hosting to hit these endpoints:
 *
 * 24-hour reminders: GET /api/cron/sms-reminders?type=24h
 * Schedule: Every hour (0 * * * *)
 *
 * 2-hour reminders: GET /api/cron/sms-reminders?type=2h
 * Schedule: Every 30 minutes (*\/30 * * * *)
 *
 * Birthday messages: GET /api/cron/sms-reminders?type=birthday
 * Schedule: Daily at 9 AM (0 9 * * *)
 *
 * Service reminders: GET /api/cron/sms-reminders?type=service
 * Schedule: Weekly on Monday (0 9 * * 1)
 *
 * No-show follow-ups: GET /api/cron/sms-reminders?type=noshow
 * Schedule: Daily at 6 PM (0 18 * * *)
 */

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    switch (type) {
      case '24h':
        await SMSScheduler.send24HourReminders()
        return NextResponse.json({
          success: true,
          message: '24-hour reminders processed'
        })

      case '2h':
        await SMSScheduler.send2HourReminders()
        return NextResponse.json({
          success: true,
          message: '2-hour reminders processed'
        })

      case 'birthday':
        await SMSScheduler.sendBirthdayMessages()
        return NextResponse.json({
          success: true,
          message: 'Birthday messages processed'
        })

      case 'service':
        await SMSScheduler.sendServiceReminders()
        return NextResponse.json({
          success: true,
          message: 'Service reminders processed'
        })

      case 'noshow':
        await SMSScheduler.sendNoShowFollowUps()
        return NextResponse.json({
          success: true,
          message: 'No-show follow-ups processed'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter. Use: 24h, 2h, birthday, service, or noshow' },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Also allow POST for flexibility
export async function POST(request: NextRequest) {
  return GET(request)
}
