import Link from 'next/link'
import { Phone } from 'lucide-react'

export default function PrivacyPolicy() {
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
        <h1 className="text-4xl font-bold text-text-primary font-[family-name:var(--font-manrope)] tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-text-muted mb-12">Last Updated: March 3, 2026</p>

        <div className="space-y-10">
          <Section title="1. Information We Collect">
            <p>VoiceFly collects information that you provide directly to us, including:</p>
            <List items={[
              'Account information (name, email, company name)',
              'Business information for service delivery',
              'Phone numbers provided for SMS and voice communication',
              'SMS message content sent to and from our platform',
              'Voice call data and transcripts',
              'Usage data and analytics',
              'Payment information (processed securely via Stripe)',
            ]} />
          </Section>

          <Section title="2. How We Use Your Information">
            <p>We use the information we collect to:</p>
            <List items={[
              'Provide, maintain, and improve our services',
              'Process your transactions and send related information',
              'Send technical notices and support messages',
              'Respond to your comments and questions',
              'Monitor and analyze trends, usage, and activities',
            ]} />
          </Section>

          <Section title="3. SMS and Messaging Data">
            <p>When you or your customers interact with VoiceFly via SMS:</p>
            <List items={[
              'We collect phone numbers and message content to deliver AI-powered responses',
              'Message data is used solely to provide the requested service and improve response quality',
              'We do not sell, share, or use SMS opt-in data or phone numbers for marketing purposes unrelated to the service',
              'SMS data is not shared with third parties for their marketing or promotional purposes',
              'Message logs are retained for service delivery, analytics, and compliance purposes',
              'End users may opt out of SMS messages at any time by replying STOP',
            ]} />
          </Section>

          <Section title="4. Information Sharing">
            <p>We do not sell or share your personal information with third parties except:</p>
            <List items={[
              'With your consent',
              'To comply with legal obligations',
              'With service providers who assist in our operations (all under strict confidentiality agreements)',
              'To protect the rights and safety of VoiceFly and our users',
            ]} />
          </Section>

          <Section title="5. Data Security">
            <p>We implement industry-standard security measures to protect your information, including:</p>
            <List items={[
              'Encryption of data in transit and at rest',
              'Regular security audits and updates',
              'Access controls and authentication measures',
              'SOC 2 and HIPAA compliance standards',
            ]} />
          </Section>

          <Section title="6. Your Rights">
            <p>You have the right to:</p>
            <List items={[
              'Access and receive a copy of your personal data',
              'Correct inaccurate or incomplete data',
              'Request deletion of your data',
              'Object to or restrict processing of your data',
              'Data portability',
            ]} />
          </Section>

          <Section title="7. Data Retention">
            <p>We retain your information for as long as your account is active or as needed to provide services. We will delete or anonymize your information upon account closure, subject to legal retention requirements.</p>
          </Section>

          <Section title="8. Cookies and Tracking">
            <p>We use cookies and similar technologies to collect usage data and improve our services. You can control cookies through your browser settings.</p>
          </Section>

          <Section title="9. Contact Us">
            <p>If you have any questions about this Privacy Policy, please contact us at:</p>
            <p className="mt-2"><span className="text-text-primary font-medium">Email:</span> tony@dropfly.io</p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the &ldquo;Last Updated&rdquo; date.</p>
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
