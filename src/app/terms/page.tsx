import Link from 'next/link'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-sm text-gray-600 mb-8">Last Updated: October 2, 2025</p>

          <div className="prose prose-blue max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 mb-6">
              By accessing and using VoiceFly ("Service"), you accept and agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use the Service.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 mb-6">
              VoiceFly provides AI-powered voice communication, lead generation, and business automation services.
              We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Account Registration</h2>
            <p className="text-gray-700 mb-4">
              To use VoiceFly, you must:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Be responsible for all activities under your account</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Be at least 18 years old or have parental consent</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Subscription and Billing</h2>
            <p className="text-gray-700 mb-4">
              <strong>4.1 Subscription Plans:</strong> VoiceFly offers various subscription tiers with different features and pricing.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>4.2 Billing:</strong> Subscriptions are billed monthly or annually in advance. All fees are non-refundable
              except as required by law or as explicitly stated in these terms.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>4.3 Free Trial:</strong> We may offer a free trial period. You will be charged at the end of the trial
              unless you cancel before the trial ends.
            </p>
            <p className="text-gray-700 mb-6">
              <strong>4.4 Cancellation:</strong> You may cancel your subscription at any time. Your access will continue
              until the end of your current billing period.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Acceptable Use</h2>
            <p className="text-gray-700 mb-4">
              You agree NOT to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Violate any laws, including telemarketing and privacy regulations</li>
              <li>Transmit spam, harassment, or offensive content</li>
              <li>Attempt to gain unauthorized access to the Service</li>
              <li>Reverse engineer or copy any part of the Service</li>
              <li>Use the Service to harm, threaten, or harass others</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Intellectual Property</h2>
            <p className="text-gray-700 mb-6">
              VoiceFly and its content are protected by copyright, trademark, and other intellectual property laws.
              You retain ownership of your data, and we retain ownership of the Service and its underlying technology.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Data and Privacy</h2>
            <p className="text-gray-700 mb-6">
              Your use of the Service is also governed by our Privacy Policy. We handle your data in accordance with
              applicable data protection laws, including GDPR and CCPA where applicable.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Service Level and Uptime</h2>
            <p className="text-gray-700 mb-6">
              We strive to maintain 99.9% uptime but do not guarantee uninterrupted access. We are not liable for
              service interruptions caused by factors beyond our reasonable control.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">9. Limitation of Liability</h2>
            <p className="text-gray-700 mb-6">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, VOICEFLY SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
              SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED
              DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, OR GOODWILL.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">10. Indemnification</h2>
            <p className="text-gray-700 mb-6">
              You agree to indemnify and hold VoiceFly harmless from any claims, damages, or expenses arising from
              your use of the Service or violation of these Terms.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">11. Termination</h2>
            <p className="text-gray-700 mb-6">
              We may suspend or terminate your access to the Service at any time for violation of these Terms or
              for any other reason. Upon termination, your right to use the Service will immediately cease.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">12. Governing Law</h2>
            <p className="text-gray-700 mb-6">
              These Terms are governed by the laws of [Your Jurisdiction], without regard to conflict of law principles.
              Any disputes shall be resolved in the courts of [Your Jurisdiction].
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">13. Changes to Terms</h2>
            <p className="text-gray-700 mb-6">
              We reserve the right to modify these Terms at any time. We will notify users of material changes via
              email or through the Service. Continued use after changes constitutes acceptance of the new Terms.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">14. Contact Information</h2>
            <p className="text-gray-700 mb-6">
              For questions about these Terms, please contact us at:
              <br />
              <strong>Email:</strong> legal@voicefly.ai
              <br />
              <strong>Address:</strong> VoiceFly Inc., [Your Business Address]
            </p>
          </div>

          <div className="mt-12 pt-6 border-t border-gray-200">
            <Link href="/" className="text-blue-600 hover:text-blue-500 font-semibold">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
