import React from "react";
import Link from "next/link";
import { RotateCcw, CheckCircle, PackageCheck, AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";

export const metadata = {
  title: "30-Day Return & Exchange Policy | OFFVYBE",
  description: "Complimentary 30-day doorstep return and size exchange policy for OFFVYBE menswear across India.",
};

export default function ReturnsPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* Back Link */}
      <Link
        href="/"
        className="inline-flex min-h-[44px] items-center gap-2 text-xs font-semibold uppercase tracking-wider text-burgundy hover:text-crimson transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to home</span>
      </Link>

      {/* Header */}
      <div className="space-y-3 pb-8 border-b border-burgundy/15">
        <div className="flex items-center space-x-2 text-crimson text-xs font-bold uppercase tracking-[0.2em]">
          <RotateCcw className="w-4 h-4" />
          <span>Atelier Satisfaction Guarantee</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-espresso">
          30-Day Returns & Exchanges
        </h1>
        <p className="text-xs sm:text-sm text-espresso/70 leading-relaxed font-light">
          Doorstep Reverse Pickup across India • Zero Reverse Logistics Fees
        </p>
        <p className="text-xs text-espresso/80 leading-relaxed">
          We want you to be entirely satisfied with the drape, silhouette, and tactile feel of every OFFVYBE garment.
          If a size is not ideal or a piece does not suit your sartorial vision, we offer complimentary 30-day doorstep returns and exchanges.
        </p>
      </div>

      {/* Policy Sections */}
      <div className="space-y-10 text-xs sm:text-sm text-espresso/85 leading-relaxed">
        {/* 3 Step Protocol */}
        <section className="space-y-4">
          <h2 className="font-serif text-xl font-bold text-espresso">
            1. The 3-Step Seamless Return Process
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="p-5 bg-white rounded-2xl border border-burgundy/15 shadow-xs space-y-2">
              <span className="w-7 h-7 rounded-full bg-burgundy text-gold font-bold text-xs flex items-center justify-center">1</span>
              <h3 className="font-serif font-bold text-espresso text-sm">Initiate Request</h3>
              <p className="text-xs text-espresso/70">
                Log into your client profile or email concierge@offvybe.in with your order number and requested size swap or return.
              </p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-burgundy/15 shadow-xs space-y-2">
              <span className="w-7 h-7 rounded-full bg-burgundy text-gold font-bold text-xs flex items-center justify-center">2</span>
              <h3 className="font-serif font-bold text-espresso text-sm">Doorstep Pickup</h3>
              <p className="text-xs text-espresso/70">
                A Blue Dart or Delhivery courier partner visits your address within 24–48 hours with a prepaid security tamper-proof bag.
              </p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-burgundy/15 shadow-xs space-y-2">
              <span className="w-7 h-7 rounded-full bg-burgundy text-gold font-bold text-xs flex items-center justify-center">3</span>
              <h3 className="font-serif font-bold text-espresso text-sm">Instant Exchange / Refund</h3>
              <p className="text-xs text-espresso/70">
                Replacement size is dispatched immediately upon pickup scan, or your refund is initiated to your original bank/UPI account.
              </p>
            </div>
          </div>
        </section>

        {/* 2. Eligibility Criteria */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-espresso flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-burgundy" />
            <span>2. Garment Eligibility Guidelines</span>
          </h2>
          <p>
            To qualify for full reimbursement or size exchange, garments must satisfy our standard atelier quality checks:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs text-espresso/75">
            <li><strong>Condition:</strong> Unworn, unwashed, and free of cologne, marks, or alterations.</li>
            <li><strong>Original Packaging:</strong> Garment folded in the protective cedar pouch with brand swing tags and barcode integrity intact.</li>
            <li><strong>Timeline:</strong> Return or exchange request registered within 30 calendar days from the date of confirmed courier delivery.</li>
          </ul>
        </section>

        {/* 3. Refund Settlement Timeline */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-espresso">
            3. Refund Timelines by Payment Method
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse border border-burgundy/15">
              <thead>
                <tr className="bg-ivory text-espresso font-serif">
                  <th className="p-3 border border-burgundy/15">Payment Method</th>
                  <th className="p-3 border border-burgundy/15">Reimbursement Channel</th>
                  <th className="p-3 border border-burgundy/15">Settlement SLA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-burgundy/10">
                <tr>
                  <td className="p-3 border border-burgundy/15 font-semibold">UPI (GPay / PhonePe / Paytm)</td>
                  <td className="p-3 border border-burgundy/15">Direct credit to linked bank VPA</td>
                  <td className="p-3 border border-burgundy/15 font-semibold text-green-800">24–48 Business Hours</td>
                </tr>
                <tr>
                  <td className="p-3 border border-burgundy/15 font-semibold">Credit / Debit Cards</td>
                  <td className="p-3 border border-burgundy/15">Original Card Statement Reversal</td>
                  <td className="p-3 border border-burgundy/15">3–5 Business Days (bank dependent)</td>
                </tr>
                <tr>
                  <td className="p-3 border border-burgundy/15 font-semibold">Net Banking</td>
                  <td className="p-3 border border-burgundy/15">Original Source Bank Account</td>
                  <td className="p-3 border border-burgundy/15">3–5 Business Days</td>
                </tr>
                <tr>
                  <td className="p-3 border border-burgundy/15 font-semibold">Cash on Delivery (COD)</td>
                  <td className="p-3 border border-burgundy/15">Secure NEFT / IMPS Bank Transfer or Store Credit</td>
                  <td className="p-3 border border-burgundy/15">2 Business Days upon bank details receipt</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. Contact support */}
        <section className="p-6 bg-white rounded-2xl border border-burgundy/20 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-burgundy font-bold text-sm">
            <RefreshCw className="w-5 h-5" />
            <span>Start a Return or Exchange Right Now</span>
          </div>
          <p className="text-xs text-espresso/75 leading-relaxed">
            Our support team is ready to assist you with immediate sizing guidance or scheduling your reverse courier pickup:
          </p>
          <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-burgundy">
            <Link
              href="/profile"
              className="py-2.5 px-5 bg-burgundy hover:bg-crimson text-ivory rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Go to Profile & Orders
            </Link>
            <a
              href="mailto:returns@offvybe.in"
              className="py-2.5 px-5 border border-burgundy text-burgundy hover:bg-burgundy/5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Email returns@offvybe.in
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
