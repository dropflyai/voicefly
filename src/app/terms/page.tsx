import Link from 'next/link'
import { Phone } from 'lucide-react'

export default function TermsOfService() {
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
            Start Free Trial
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-text-primary font-[family-name:var(--font-manrope)] tracking-tight mb-2">Terms of Service</h1>
        <p className="text-sm text-text-muted mb-12">Last Updated: March 3, 2026</p>

        <div className="space-y-10">
          <Section title="1. Acceptance of Terms">
            <p>By accessing and using VoiceFly (&ldquo;Service&rdquo;), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.</p>
          </Section>

          <Section title="2. Description of Service">
            <p>VoiceFly (the &ldquo;Program&rdquo;) provides AI-powered voice communication, SMS messaging, lead generation, and business automation services. We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time.</p>
          </Section>

          <Section title="3. SMS Messaging Terms">
            <p>By interacting with VoiceFly via SMS, you agree to the following:</p>
            <List items={[
              'Program Name: VoiceFly AI Messaging',
              'Message Frequency: Message frequency varies based on your interactions. You may receive automated AI-powered replies each time you send an SMS to a VoiceFly-enabled business number.',
              'Message and Data Rates: Standard message and data rates may apply. Please contact your wireless carrier for details about your messaging plan.',
              'Opt-Out: You can opt out of receiving SMS messages at any time by replying STOP to any message. You will receive a one-time confirmation that you have been unsubscribed.',
              'Help: For support, reply HELP to any message or contact us at tony@dropfly.io.',
              'Supported Carriers: VoiceFly messaging is supported on all major US carriers including AT&T, T-Mobile, Verizon, and others.',
            ]} />
            <p className="mt-3">VoiceFly and its service providers will not be liable for any delays or failures in the receipt of any SMS messages. Consent to receive SMS messages is not a condition of purchase.</p>
          </Section>

          <Section title="4. Account Registration">
            <p>To use VoiceFly, you must:</p>
            <List items={[
              'Provide accurate and complete registration information',
              'Maintain the security of your account credentials',
              'Be responsible for all activities under your account',
              'Notify us immediately of any unauthorized access',
              'Be at least 18 years old or have parental consent',
            ]} />
          </Section>

          <Section title="5. Subscription and Billing">
            <p><span className="text-text-primary font-medium">5.1 Subscription Plans:</span> VoiceFly offers various subscription tiers with different features and pricing.</p>
            <p><span className="text-text-primary font-medium">5.2 Billing:</span> Subscriptions are billed monthly or annually in advance. All fees are non-refundable except as required by law or as explicitly stated in these terms.</p>
            <p><span className="text-text-primary font-medium">5.3 Free Trial:</span> We may offer a free trial period. You will be charged at the end of the trial unless you cancel before the trial ends.</p>
            <p><span className="text-text-primary font-medium">5.4 Cancellation:</span> You may cancel your subscription at any time. Your access will continue until the end of your current billing period.</p>
          </Section>

          <Section title="6. Acceptable Use">
            <p>You agree NOT to:</p>
            <List items={[
              'Use the Service for any illegal or unauthorized purpose',
              'Violate any laws, including telemarketing and privacy regulations',
              'Transmit spam, harassment, or offensive content',
              'Attempt to gain unauthorized access to the Service',
              'Reverse engineer or copy any part of the Service',
              'Use the Service to harm, threaten, or harass others',
            ]} />
          </Section>

          <Section title="7. Intellectual Property">
            <p>VoiceFly and its content are protected by copyright, trademark, and other intellectual property laws. You retain ownership of your data, and we retain ownership of the Service and its underlying technology.</p>
          </Section>

          <Section title="8. Data and Privacy">
            <p>Your use of the Service is also governed by our <Link href="/privacy" className="text-brand-light hover:text-brand-primary transition-colors">Privacy Policy</Link>. We handle your data in accordance with applicable data protection laws, including GDPR and CCPA where applicable.</p>
          </Section>

          <Section title="9. Service Level and Uptime">
            <p>We strive to maintain 99.9% uptime but do not guarantee uninterrupted access. We are not liable for service interruptions caused by factors beyond our reasonable control.</p>
          </Section>

          <Section title="10. Limitation of Liability">
            <p className="uppercase text-sm">To the maximum extent permitted by law, VoiceFly shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, or goodwill.</p>
          </Section>

          <Section title="11. Indemnification">
            <p>You agree to indemnify and hold VoiceFly harmless from any claims, damages, or expenses arising from your use of the Service or violation of these Terms.</p>
          </Section>

          <Section title="12. Termination">
            <p>We may suspend or terminate your access to the Service at any time for violation of these Terms or for any other reason. Upon termination, your right to use the Service will immediately cease.</p>
          </Section>

          <Section title="13. Governing Law">
            <p>These Terms are governed by the laws of the State of California, without regard to conflict of law principles. Any disputes shall be resolved in the courts of Los Angeles County, California.</p>
          </Section>

          <Section title="14. Changes to Terms">
            <p>We reserve the right to modify these Terms at any time. We will notify users of material changes via email or through the Service. Continued use after changes constitutes acceptance of the new Terms.</p>
          </Section>

          <Section title="15. Contact Information">
            <p>For questions about these Terms, please contact us at:</p>
            <p className="mt-2"><span className="text-text-primary font-medium">Email:</span> tony@dropfly.io</p>
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
    <ul className="mt-2 space-y-2">
      {items.map(item => (
        <li key={item} className="flex items-start gap-2 text-text-secondary">
          <span className="text-brand-primary mt-1.5 text-xs">&#9679;</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}
