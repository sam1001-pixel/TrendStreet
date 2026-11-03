import React from "react";
import Link from "next/link";
import { Scale, FileCheck, AlertCircle, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service | OFFVYBE",
  description: "Terms and Conditions of OFFVYBE luxury menswear e-commerce platform pursuant to Indian Consumer Protection (E-Commerce) Rules 2020.",
};

export default function TermsPage() {
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
          <Scale className="w-4 h-4" />
          <span>Statutory Terms of Use</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-espresso">
          Terms of Service
        </h1>
        <p className="text-xs sm:text-sm text-espresso/70 leading-relaxed font-light">
          Effective Date: January 1, 2026 • Governed by the Laws of the Republic of India
        </p>
        <p className="text-xs text-espresso/80 leading-relaxed">
          Welcome to OFFVYBE. By accessing or acquiring menswear garments through <strong>offvybe.in</strong> (&ldquo;Website&rdquo; or &ldquo;Store&rdquo;),
          operated by <strong>OFFVYBE</strong>, you agree to be bound by these Terms of Service.
          Please read these terms carefully before placing an order.
        </p>
      </div>

      {/* Terms Sections */}
      <div className="space-y-10 text-xs sm:text-sm text-espresso/85 leading-relaxed">
        {/* 1. Atelier Niche & Brand Boundaries */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-espresso">
            1. Brand Philosophy & Garment Silhouettes
          </h2>
          <p>
            OFFVYBE operates exclusively as an architectural luxury menswear streetwear label. Our collections are restricted strictly to four distinct product silhouettes:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
            <div className="p-3 bg-ivory rounded-lg border border-burgundy/15 font-semibold text-burgundy text-xs">
              Oversized Tops & Hoodies
            </div>
            <div className="p-3 bg-ivory rounded-lg border border-burgundy/15 font-semibold text-burgundy text-xs">
              Selvedge & Baggy Jeans
            </div>
            <div className="p-3 bg-ivory rounded-lg border border-burgundy/15 font-semibold text-burgundy text-xs">
              Boxy Fit Essentials
            </div>
            <div className="p-3 bg-ivory rounded-lg border border-burgundy/15 font-semibold text-burgundy text-xs">
              Flight & Bomber Jackets
            </div>
          </div>
          <p className="text-xs text-espresso/70 italic">
            OFFVYBE does not manufacture, market, or stock formal suiting, dress footwear, or unrelated accessories.
          </p>
        </section>

        {/* 2. Indian Pricing & Statutory Taxes */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-espresso">
            2. Pricing, Currency & Statutory Taxes (GST)
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-xs text-espresso/75">
            <li>
              <strong>Primary Currency:</strong> All prices displayed on OFFVYBE are denominated in <strong>Indian Rupees (INR / ₹)</strong>.
            </li>
            <li>
              <strong>Inclusive Taxation:</strong> In accordance with Indian legal requirements, all displayed retail prices are fully inclusive of statutory Goods and Services Tax (GST on apparel is 5% for pieces sold at up to ₹2,500 and 18% above). A detailed GST tax invoice with HSN classification codes is issued with every shipment.
            </li>
            <li>
              <strong>Complimentary Shipping Threshold:</strong> Domestic orders of ₹1,999 and above receive complimentary express air courier delivery across India. Orders below ₹1,999 are subject to a nominal courier fee (Standard Surface ₹150; Express Air ₹250).
            </li>
            <li>
              <strong>Promotional Codes:</strong> Authentic promotional codes (e.g. TREND10, STREET20) are subject to declared minimum spend criteria and cannot be combined or converted to cash.
            </li>
          </ul>
        </section>

        {/* 3. Orders & Server Authorization */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-espresso">
            3. Order Acceptance & Price Verification
          </h2>
          <p>
            Your placement of an order constitutes an offer to purchase. OFFVYBE validates product availability and pricing server-side before confirming garment allocation. In the rare event of typographical pricing error or inventory unavailability, OFFVYBE reserves the right to cancel or refund the allocation before dispatch, with prompt notification to the client.
          </p>
        </section>

        {/* 4. Payment Methods & Verification */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-espresso">
            4. Payment Gateways & Cash on Delivery (COD)
          </h2>
          <p>
            We offer secure payment channels compliant with Reserve Bank of India (RBI) mandates:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs text-espresso/75">
            <li><strong>UPI:</strong> Instant one-click collect requests supported via Google Pay, PhonePe, Paytm, BHIM, and bank VPAs.</li>
            <li><strong>Credit & Debit Cards:</strong> RuPay, Visa, Mastercard, and American Express processed via tokenized, 3D Secure / OTP verified gateways.</li>
            <li><strong>Net Banking:</strong> Direct authenticated transfers from all major Indian scheduled banks.</li>
            <li><strong>Cash on Delivery (COD):</strong> Permitted for orders up to ₹10,000 to serviceable Indian PIN codes. Deliveries are executed by Blue Dart Apex and Delhivery Air. Clients must provide an active mobile number for SMS dispatch updates.</li>
          </ul>
        </section>

        {/* 5. Intellectual Property */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-espresso">
            5. Intellectual Property
          </h2>
          <p>
            All trademarks, logos, typography, textile photography, 3D interactive models, editorial lookbooks, and software code on OFFVYBE are the exclusive intellectual property of OFFVYBE. Unauthorized duplication, extraction, or commercial misuse is strictly prohibited.
          </p>
        </section>

        {/* 6. Dispute Resolution & Jurisdiction */}
        <section className="p-6 bg-white rounded-2xl border border-burgundy/20 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-burgundy font-bold text-sm">
            <FileCheck className="w-5 h-5" />
            <span>6. Governing Law & Dispute Jurisdiction</span>
          </div>
          <p className="text-xs text-espresso/80 leading-relaxed">
            These Terms shall be interpreted and governed exclusively by the laws of the Republic of India.
            Any legal claim, dispute, or proceeding arising under or in connection with these Terms or website transactions
            shall be subject to the exclusive jurisdiction of the competent courts in <strong>Mumbai, Maharashtra, India</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}
