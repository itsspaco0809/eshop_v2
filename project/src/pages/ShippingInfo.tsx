import { Truck } from 'lucide-react';

export default function ShippingInfo() {
  return (
    <div className="bg-white dark:bg-neutral-950 min-h-screen text-neutral-900 dark:text-neutral-100 transition-colors duration-200">
      <div className="pt-16 md:pt-20 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 md:pt-16 md:pb-10">
          <div className="flex items-center gap-3 mb-2">
            <Truck className="w-7 h-7 text-neutral-900 dark:text-white" />
            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white tracking-tight">
              Shipping Info
            </h1>
          </div>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-lg">
            Everything you need to know about how your order gets to you.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold mb-3">Build & Dispatch Time</h2>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Every kit is built and packaged to order. Our standard build time is 4–6 weeks before
              shipment. You will receive a confirmation email with tracking information once your
              order has been dispatched.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">Shipping Rates</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
                <thead className="bg-neutral-50 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400">
                  <tr>
                    <th className="p-4 font-medium">Region</th>
                    <th className="p-4 font-medium">Estimated Time</th>
                    <th className="p-4 font-medium">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  <tr>
                    <td className="p-4">United States</td>
                    <td className="p-4">3–7 business days</td>
                    <td className="p-4 font-mono">$12.00</td>
                  </tr>
                  <tr>
                    <td className="p-4">Canada</td>
                    <td className="p-4">5–10 business days</td>
                    <td className="p-4 font-mono">$18.00</td>
                  </tr>
                  <tr>
                    <td className="p-4">Europe</td>
                    <td className="p-4">7–14 business days</td>
                    <td className="p-4 font-mono">$25.00</td>
                  </tr>
                  <tr>
                    <td className="p-4">Asia / Australia</td>
                    <td className="p-4">10–21 business days</td>
                    <td className="p-4 font-mono">$30.00</td>
                  </tr>
                  <tr>
                    <td className="p-4">Rest of World</td>
                    <td className="p-4">14–28 business days</td>
                    <td className="p-4 font-mono">$35.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-neutral-400 mt-3">
              Shipping costs are calculated at checkout based on your destination. Digital
              instruction downloads are free and delivered instantly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">Tracking Your Order</h2>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Once your kit ships, you will receive an email with a tracking number. You can also
              view your order status anytime under Order History after signing in to your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">Customs & Duties</h2>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              International orders may be subject to customs fees, import duties, or taxes imposed
              by the destination country. These charges are the responsibility of the recipient and
              are not included in our product prices or shipping costs.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">Damaged or Lost Packages</h2>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              If your order arrives damaged, please contact us at cs@lcpworks.com within 7 days of
              delivery with photos of the item and packaging. We will arrange a replacement or
              refund. For lost packages, we will work with the carrier to file a claim and either
              resend or refund your order.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">Questions?</h2>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              If you have any shipping-related questions not covered here, feel free to reach out
              via our Contact page or email cs@lcpworks.com.
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
