import Link from 'next/link'
import { Phone } from 'lucide-react'

export const metadata = {
  title: 'SMS Messaging Terms | VoiceFly',
  description: 'SMS program details for VoiceFly AI phone assistant messaging — opt-in, opt-out, message frequency, and help information.',
}

export default function SmsTerms() {
  return (
    <div className="min-h-screen bg-surface font-[family-name:var(--font-inter)]">
      {/* Header */}
      <header className="glass sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-brand-primary" />
            <span className="text-lg font-bold text-text-primary font-[family-name:var(--font-manrope)]">VoiceFly</span>
          </Link>
          <Link href="/signup" className="text-sm font-medium text-brand-on bg-brand-primary px-4 py-2 rounded-md hover:bg-[#0060d0] transition-colors">
            Forward Your Calls
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-text-primary font-[family-name:var(--font-manrope)] tracking-tight mb-2">SMS Messaging Terms</h1>
        <p className="text-sm text-text-muted mb-12">Last Updated: April 15, 2026</p>

        <div className="space-y-10">
          <Section title="Program Name">
            <p>VoiceFly AI Phone Assistant — Appointment &amp; Transactional SMS</p>
          </Section>

          <Section title="Program Description">
            <p>VoiceFly provides businesses with an AI-powered phone assistant that answers inbound calls 24/7. When a customer calls a VoiceFly-enabled business phone number, the AI assistant can send a follow-up SMS to confirm an appointment, deliver an appointment reminder, confirm an order, or send other transactional information related to the call.</p>
          </Section>

          <Section title="How Customers Opt In">
            <p>Customers provide express written consent to receive SMS messages during an inbound phone call with the AI assistant. Consent is collected verbally as follows:</p>
            <List items={[
              'The customer calls the business phone number. The call is answered by the VoiceFly AI assistant.',
              'During the conversation, the AI asks whether the customer would like to receive a text message (for example, "Would you like me to text you a confirmation?").',
              'If the customer verbally agrees, the AI confirms the mobile number and records the opt-in consent (phone number, timestamp, and call ID) in VoiceFly\'s database.',
              'Only after explicit verbal consent does the system send SMS to that customer.',
            ]} />
            <p className="mt-3">This is a phone-based opt-in, not a web form or marketing list. No SMS is sent to a customer who has not verbally opted in during a call.</p>
          </Section>

          <Section title="Types of Messages Customers May Receive">
            <List items={[
              'Appointment confirmations (e.g., "Your appointment at [business] is confirmed for [date/time]")',
              'Appointment reminders (e.g., "Reminder: you have an appointment tomorrow at [time]")',
              'Order confirmations and updates',
              'Responses to the customer\'s own inbound SMS to the business number',
            ]} />
            <p className="mt-3">All messages are transactional and tied to the customer&apos;s prior interaction with the business. VoiceFly does not send marketing or promotional SMS.</p>
          </Section>

          <Section title="Sample Messages">
            <List items={[
              '"Hi Sarah, your appointment at Acme Dental is confirmed for Thursday, April 16 at 2:00 PM. Reply STOP to opt out, HELP for help."',
              '"Reminder: You have an appointment at Acme Dental tomorrow at 2:00 PM. Reply C to confirm, R to reschedule, STOP to opt out."',
            ]} />
          </Section>

          <Section title="Message Frequency">
            <p>Message frequency varies based on the customer&apos;s interactions with the business. A typical customer may receive 1 to 3 messages per appointment or order (for example, a confirmation at the time of booking and a reminder the day before). VoiceFly does not send scheduled bulk campaigns — each message is triggered by a specific event associated with that customer.</p>
          </Section>

          <Section title="Message and Data Rates">
            <p>Standard message and data rates may apply. Please contact your wireless carrier for details about your messaging plan. VoiceFly does not charge for SMS messages; however, carrier fees still apply to the recipient as with any text message.</p>
          </Section>

          <Section title="Opt-Out">
            <p>Customers can opt out of SMS messages at any time by replying any of the following keywords to any VoiceFly message:</p>
            <p className="mt-2 font-mono text-sm text-text-primary">STOP, STOPALL, UNSUBSCRIBE, CANCEL, END, QUIT, OPTOUT, REVOKE</p>
            <p className="mt-3">After opting out, the customer will receive a one-time confirmation and will not receive any further messages. To resubscribe, the customer can reply <span className="font-mono">START</span> to the same number, or ask the AI assistant to re-enable SMS during a future call.</p>
          </Section>

          <Section title="Help">
            <p>Customers can reply <span className="font-mono">HELP</span> or <span className="font-mono">INFO</span> to any message to receive help information. The help response includes instructions to opt out and a contact phone number for support.</p>
            <p className="mt-3">For additional support, customers can call <span className="text-text-primary font-medium">(424) 888-7754</span> or email <span className="text-text-primary font-medium">tony@dropfly.io</span>.</p>
          </Section>

          <Section title="Supported Carriers">
            <p>VoiceFly SMS is supported on all major US wireless carriers including AT&amp;T, T-Mobile, Verizon, and their respective MVNOs. VoiceFly and its service providers are not liable for delays or failures in delivery caused by carrier networks.</p>
          </Section>

          <Section title="Privacy">
            <p>VoiceFly handles customer phone numbers and message content in accordance with our <Link href="/privacy" className="text-brand-light hover:text-brand-primary transition-colors">Privacy Policy</Link>. Phone numbers collected for SMS opt-in are never sold, rented, or shared with third parties for marketing purposes.</p>
          </Section>

          <Section title="Consent Is Not a Condition of Purchase">
            <p>Agreeing to receive SMS messages from VoiceFly is not a condition of purchasing any product or service. Customers can use VoiceFly-enabled business phone numbers for voice calls without opting in to SMS.</p>
          </Section>

          <Section title="Contact">
            <p>For questions about this SMS program:</p>
            <p className="mt-2"><span className="text-text-primary font-medium">Email:</span> tony@dropfly.io</p>
            <p><span className="text-text-primary font-medium">Phone:</span> (424) 888-7754</p>
          </Section>
        </div>

        <div className="mt-14 pt-6 border-t border-[rgba(65,71,84,0.15)]">
          <Link href="/" className="text-brand-light hover:text-brand-primary font-medium transition-colors">
            &larr; Back to Home
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-surface-lowest py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center space-y-4">
            <nav className="flex flex-wrap justify-center gap-6 text-sm">
              <Link href="/" className="text-text-muted hover:text-text-primary transition-colors">Home</Link>
              <Link href="/pricing" className="text-text-muted hover:text-text-primary transition-colors">Pricing</Link>
              <Link href="/privacy" className="text-text-muted hover:text-text-primary transition-colors">Privacy</Link>
              <Link href="/terms" className="text-text-muted hover:text-text-primary transition-colors">Terms</Link>
              <Link href="/sms-terms" className="text-text-muted hover:text-text-primary transition-colors">SMS Terms</Link>
            </nav>
            <p className="text-text-muted text-sm">&copy; 2026 VoiceFly. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-text-primary font-[family-name:var(--font-manrope)] mb-3">{title}</h2>
      <div className="text-text-secondary leading-relaxed space-y-3">{children}</div>
    </div>
  )
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc list-inside space-y-2">
      {items.map((item, i) => (
        <li key={i} className="text-text-secondary">{item}</li>
      ))}
    </ul>
  )
}
