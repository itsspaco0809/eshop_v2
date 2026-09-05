import { Shield } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="bg-white dark:bg-neutral-950 min-h-screen text-neutral-900 dark:text-neutral-100 transition-colors duration-200">
      <div className="pt-16 md:pt-20 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 md:pt-16 md:pb-10">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-7 h-7 text-neutral-900 dark:text-white" />
            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white tracking-tight">
              Privacy Policy
            </h1>
          </div>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-lg">
            How we collect, use, and protect your information.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold mb-3">1. Information We Collect</h2>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              We collect information you provide directly to us, such as your name, email address,
              shipping address, and payment details when you place an order or contact us. We also
              automatically collect certain data about your visit, including page views, browser
              type, and device information, to improve our website performance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">2. How We Use Your Information</h2>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              We use your information to process and fulfill orders, communicate with you about your
              purchases, respond to your inquiries, improve our products and services, and send
              occasional updates if you have opted in. We never sell your personal data to third
              parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">3. Cookies & Tracking</h2>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              We use essential cookies to keep your shopping cart and session active. Analytics data
              is collected anonymously to help us understand how visitors use the site so we can
              improve the experience. You can disable cookies in your browser settings at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">4. Data Storage & Security</h2>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Your data is stored securely using industry-standard encryption. Payment information
              is processed by our payment provider (Stripe) and is never stored on our servers.
              Access to personal data is restricted to authorized personnel only.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">5. Your Rights</h2>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              You have the right to request access to, correction of, or deletion of your personal
              data. To exercise any of these rights, contact us at cs@lcpworks.com and we will
              respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">6. Contact</h2>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              If you have any questions about this Privacy Policy, please reach out to us at
              cs@lcpworks.com.
            </p>
          </section>

          <p className="text-sm text-neutral-400 pt-6 border-t border-neutral-200 dark:border-neutral-800">
            Last updated: September 2026
          </p>
        </div>
      </div>
    </div>
  );
}
