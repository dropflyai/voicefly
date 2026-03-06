import Link from 'next/link'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-sm text-gray-600 mb-8">Last Updated: March 3, 2026</p>

          <div className="prose prose-blue max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
            <p className="text-gray-700 mb-4">
              VoiceFly collects information that you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li>Account information (name, email, company name)</li>
              <li>Business information for service delivery</li>
              <li>Phone numbers provided for SMS and voice communication</li>
              <li>SMS message content sent to and from our platform</li>
              <li>Voice call data and transcripts</li>
              <li>Usage data and analytics</li>
              <li>Payment information (processed securely via Stripe)</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li>Provide, maintain, and improve our services</li>
              <li>Process your transactions and send related information</li>
              <li>Send technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Monitor and analyze trends, usage, and activities</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. SMS and Messaging Data</h2>
            <p className="text-gray-700 mb-4">
              When you or your customers interact with VoiceFly via SMS:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li>We collect phone numbers and message content to deliver AI-powered responses</li>
              <li>Message data is used solely to provide the requested service and improve response quality</li>
              <li>We do not sell, share, or use SMS opt-in data or phone numbers for marketing purposes unrelated to the service</li>
              <li>SMS data is not shared with third parties for their marketing or promotional purposes</li>
              <li>Message logs are retained for service delivery, analytics, and compliance purposes</li>
              <li>End users may opt out of SMS messages at any time by replying <strong>STOP</strong></li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Information Sharing</h2>
            <p className="text-gray-700 mb-4">
              We do not sell or share your personal information with third parties except:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>With service providers who assist in our operations (all under strict confidentiality agreements)</li>
              <li>To protect the rights and safety of VoiceFly and our users</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Data Security</h2>
            <p className="text-gray-700 mb-6">
              We implement industry-standard security measures to protect your information, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication measures</li>
              <li>SOC 2 and HIPAA compliance standards</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Your Rights</h2>
            <p className="text-gray-700 mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li>Access and receive a copy of your personal data</li>
              <li>Correct inaccurate or incomplete data</li>
              <li>Request deletion of your data</li>
              <li>Object to or restrict processing of your data</li>
              <li>Data portability</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Data Retention</h2>
            <p className="text-gray-700 mb-6">
              We retain your information for as long as your account is active or as needed to provide services.
              We will delete or anonymize your information upon account closure, subject to legal retention requirements.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Cookies and Tracking</h2>
            <p className="text-gray-700 mb-6">
              We use cookies and similar technologies to collect usage data and improve our services. You can control
              cookies through your browser settings.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">9. Contact Us</h2>
            <p className="text-gray-700 mb-6">
              If you have any questions about this Privacy Policy, please contact us at:
              <br />
              <strong>Email:</strong> support@voiceflyai.com
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">10. Changes to This Policy</h2>
            <p className="text-gray-700 mb-6">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by
              posting the new policy on this page and updating the "Last Updated" date.
            </p>
          </div>

          <div className="mt-12 pt-6 border-t border-gray-200">
            <Link href="/" className="text-blue-600 hover:text-blue-500 font-semibold">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center space-y-4">
            <nav className="flex flex-wrap justify-center gap-6 text-sm">
              <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                Home
              </Link>
              <Link href="/features" className="text-gray-400 hover:text-white transition-colors">
                Features
              </Link>
              <Link href="/pricing" className="text-gray-400 hover:text-white transition-colors">
                Pricing
              </Link>
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                Terms
              </Link>
            </nav>
            <p className="text-gray-400 text-sm">
              © 2026 VoiceFly. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
