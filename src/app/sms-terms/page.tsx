import Link from 'next/link'
import { Phone } from 'lucide-react'

export const metadata = {
  title: 'SMS Messaging Terms | VoiceFly',
  description: 'SMS program details for VoiceFly account notifications — opt-in, opt-out, message frequency, and help information.',
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
            <p>VoiceFly Account Notifications</p>
          </Section>

          <Section title="Program Description">
            <p>VoiceFly sends transactional SMS messages to account holders (business owners who have signed up at voiceflyai.com). Messages are limited to account-related notifications: onboarding progress, trial expiration warnings, billing updates, and replies to inbound messages sent to our business line at <span className="text-text-primary font-medium">(424) 888-7754</span>.</p>
            <p>This program does <strong>not</strong> send marketing or promotional messages, and does <strong>not</strong> send SMS to end customers of our users&apos; businesses. Those flows are handled under separate per-business registrations.</p>
          </Section>

          <Section title="How Users Opt In">
            <p>Users opt in to receive SMS by:</p>
            <List items={[
              'Creating a VoiceFly account at voiceflyai.com/signup, providing a mobile phone number, and checking the "Send me account notifications by SMS" checkbox before submitting the signup form.',
              'Sending an inbound SMS to (424) 888-7754 (for example, to test their configuration or respond to an onboarding prompt). Sending a message first is treated as express consent to receive replies.',
            ]} />
            <p className="mt-3">Consent, phone number, timestamp, and source are recorded in VoiceFly&apos;s audit log at the moment of opt-in.</p>
          </Section>

          <Section title="Message Types and Samples">
            <p>All messages fall into one of the following categories:</p>
            <List items={[
              'Onboarding: "Welcome to VoiceFly! Your AI employee is being set up. Reply STOP to opt out."',
              'Trial status: "Your VoiceFly trial ends in 3 days. Log in to keep your AI employee active. Reply STOP to opt out."',
              'Billing: "Your VoiceFly payment failed. Please update your card at voiceflyai.com/dashboard/billing. Reply STOP to opt out."',
              'Replies: conversational responses when a user texts (424) 888-7754 for support or testing.',
            ]} />
          </Section>

          <Section title="Message Frequency">
            <p>Message frequency is transactional and event-driven — messages are sent only when an event on the user&apos;s account warrants a notification. A typical user receives 1–4 messages per month.</p>
          </Section>

          <Section title="Message and Data Rates">
            <p>Standard message and data rates may apply. Contact your wireless carrier for details about your messaging plan. VoiceFly does not charge for SMS messages.</p>
          </Section>

          <Section title="Opt-Out">
            <p>You can opt out at any time by replying any of the following keywords to any VoiceFly message:</p>
            <p className="mt-2 font-mono text-sm text-text-primary">STOP, STOPALL, UNSUBSCRIBE, CANCEL, END, QUIT, OPTOUT, REVOKE</p>
            <p className="mt-3">You will receive a one-time confirmation and will not receive further messages. To resubscribe, reply <span className="font-mono">START</span> to the same number.</p>
          </Section>

          <Section title="Help">
            <p>Reply <span className="font-mono">HELP</span> or <span className="font-mono">INFO</span> to any message for assistance. For additional support, contact <span className="text-text-primary font-medium">tony@dropfly.io</span> or call <span className="text-text-primary font-medium">(424) 888-7754</span>.</p>
          </Section>

          <Section title="Supported Carriers">
            <p>VoiceFly SMS is supported on all major US wireless carriers including AT&amp;T, T-Mobile, Verizon, and their respective MVNOs. VoiceFly is not liable for delays or failures in delivery caused by carrier networks.</p>
          </Section>

          <Section title="Privacy">
            <p>Phone numbers and message content are handled in accordance with our <Link href="/privacy" className="text-brand-light hover:text-brand-primary transition-colors">Privacy Policy</Link>. Phone numbers collected for SMS opt-in are never sold, rented, or shared with third parties for marketing purposes.</p>
          </Section>

          <Section title="Consent Is Not a Condition of Service">
            <p>Agreeing to receive SMS notifications is optional. You can use VoiceFly without opting in to SMS; account notifications will still be sent by email.</p>
          </Section>

          <Section title="Customers of VoiceFly Users">
            <p>If you are a customer of a business that uses VoiceFly&apos;s AI phone assistant (for example, you called a salon and received an appointment reminder text), that SMS was sent under a separate A2P 10DLC registration owned by that business, not this program. Your opt-in, opt-out, and help keywords still apply.</p>
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
