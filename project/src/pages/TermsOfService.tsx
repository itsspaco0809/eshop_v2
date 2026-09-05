import { FileText } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="bg-white dark:bg-neutral-950 min-h-screen text-neutral-900 dark:text-neutral-100 transition-colors duration-200">
      <div className="pt-16 md:pt-20 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 md:pt-16 md:pb-10">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-7 h-7 text-neutral-900 dark:text-white" />
            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white tracking-tight">
              Terms of Service
            </h1>
          </div>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-lg">
            The rules and expectations for using our store and products.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold mb-3">1. Acceptance of Terms</h2>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              By accessing and using LCP.Works, you agree to be bound by these Terms of Service. If
              you do not agree with any part of these terms, please do not use our website or
              purchase our products.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">2. Products & Licensing</h2>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Our brick kits are custom-designed and are not affiliated with or endorsed by the LEGO
              Group or any automobile manufacturer. Digital instructions are licensed for personal
              use only. You may not resell, redistribute, or share digital files purchased from our
              store.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">3. Orders & Payment</h2>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              All orders are subject to availability and confirmation. Prices are listed in USD and
              may be converted to your local currency at checkout. We reserve the right to cancel
              any order before it has been shipped. Payment is processed securely via Stripe.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">4. Shipping & Delivery</h2>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Custom kits are built to order and typically ship within 4–6 weeks. Delivery times
              vary by destination. We are not responsible for delays caused by customs or shipping
              carriers. For full details, please see our Shipping Info page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">5. Returns & Refunds</h2>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Due to the custom nature of our products, all sales are final unless the item arrives
              damaged or defective. If you receive a damaged kit, contact us within 7 days of
              delivery with photos and we will arrange a replacement or refund.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">6. Intellectual Property</h2>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              All content on this website, including product designs, images, and text, is the
              property of LCP.Works and may not be reproduced without written permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">7. Limitation of Liability</h2>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              LCP.Works is not liable for any indirect, incidental, or consequential damages arising
              from the use of our products or website. Our total liability shall not exceed the
              amount you paid for the product in question.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">8. Changes to These Terms</h2>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              We may update these Terms of Service from time to time. The most current version will
              always be posted on this page with the updated date.
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
