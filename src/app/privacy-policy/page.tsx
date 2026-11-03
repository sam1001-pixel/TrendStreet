import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, FileText, Mail, MapPin, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | Trend Street Atelier",
  description: "Trend Street Privacy Policy in compliance with the Digital Personal Data Protection Act 2023 (DPDP Act) and international data privacy benchmarks.",
};

export default function PrivacyPolicyPage() {
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
          <ShieldCheck className="w-4 h-4" />
          <span>Statutory Data Protection Notice</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-espresso">
          Privacy Policy
        </h1>
        <p className="text-xs sm:text-sm text-espresso/70 leading-relaxed font-light">
          Effective Date: January 1, 2026 • Last Updated: October 2026
        </p>
        <p className="text-xs text-espresso/80 leading-relaxed">
          At <strong>Trend Street Luxury Apparels Private Limited</strong> (&ldquo;Trend Street&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;),
          safeguarding your privacy and managing personal data responsibly is foundational to our atelier philosophy.
          This Privacy Policy details how we collect, process, secure, and honor your personal data across our digital platforms
          in compliance with the <strong>Digital Personal Data Protection Act 2023 (DPDP Act, India)</strong>,
          the Information Technology Act 2000, and global data privacy standards.
        </p>
      </div>

      {/* Policy Sections */}
      <div className="space-y-10 text-xs sm:text-sm text-espresso/85 leading-relaxed">
        {/* 1. Data We Collect */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-espresso flex items-center gap-2">
            <span>1. Information We Collect</span>
          </h2>
          <p>
            When you interact with our website, create a client profile, or place an order, we may collect the following categories of data:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs text-espresso/75">
            <li>
              <strong>Identity & Contact Information:</strong> Full legal name, email address, mobile telephone number, and communication preferences.
            </li>
            <li>
              <strong>Delivery & Logistics Data:</strong> Shipping street address, apartment/suite number, landmark, city, state/UT, and 6-digit Indian PIN code.
            </li>
            <li>
              <strong>Sartorial Sizing Specifications:</strong> Preferred garment cut profiles (Oversized, Boxy Fit, Selvedge Denim waist/inseam, and Flight Jacket specifications) voluntarily provided to personalize fit recommendations.
            </li>
            <li>
              <strong>Transaction & Payment Records:</strong> Order item history, invoice reference, payment mode (UPI, Card, Net Banking, or COD), transaction timestamps, and tokenized payment gateway identifiers (handled via PCI-DSS Level 1 certified partners). We never retain raw card numbers, CVVs, or bank PINs on our servers.
            </li>
            <li>
              <strong>Technical & Session Identifiers:</strong> IP address, device type, browser specifications, and anonymous interaction metrics for site security, fraud prevention, and performance telemetry.
            </li>
          </ul>
        </section>

        {/* 2. Lawful Grounds & Purpose */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-espresso">
            2. Purpose and Lawful Grounds for Processing
          </h2>
          <p>
            We process your personal information strictly for legitimate, declared purposes under the DPDP Act 2023:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs text-espresso/75">
            <li><strong>Fulfillment of Orders:</strong> Allocating inventory, cutting fabrics, printing GST-compliant tax invoices, and scheduling door-to-door courier dispatch.</li>
            <li><strong>Courier Coordination:</strong> Transmitting destination details to licensed Indian logistics partners (Blue Dart Apex, Delhivery Air, DTDC) for delivery updates, tracking SMS, and Cash on Delivery validation.</li>
            <li><strong>Customer Concierge Support:</strong> Responding to client sizing inquiries, reverse pickup scheduling, and warranty consultations.</li>
            <li><strong>Statutory & Tax Compliance:</strong> Maintaining statutory accounting books and auditing invoices pursuant to the Central Goods and Services Tax (CGST) Act, 2017.</li>
            <li><strong>Atelier Security & Fraud Mitigation:</strong> Monitoring suspicious rate-limiting spikes, preventing automated credential stuffing, and maintaining session integrity.</li>
          </ul>
        </section>

        {/* 3. Data Protection & Encryption */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-espresso flex items-center gap-2">
            <Lock className="w-5 h-5 text-burgundy" />
            <span>3. Technical Security Safeguards</span>
          </h2>
          <p>
            Trend Street enforces bank-grade defense-in-depth security measures to protect your personal data from unauthorized access, alteration, or disclosure:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs text-espresso/75">
            <li><strong>Transport Security:</strong> 256-Bit TLS 1.3 encryption across all public and internal administrative network pathways.</li>
            <li><strong>Session & Secret Integrity:</strong> Cryptographically signed HMAC-SHA256 session tokens with sliding-window edge rate limiting against brute-force attempts.</li>
            <li><strong>Zero Raw Credential Storage:</strong> Payment card processing is delegated directly to RBI-authorized, PCI-DSS compliant payment gateways with tokenization.</li>
            <li><strong>Restricted Atelier Access:</strong> Administrative database access is restricted using role-based access control (RBAC), multi-factor verification, and audit logging.</li>
          </ul>
        </section>

        {/* 4. Your Rights Under DPDP Act 2023 */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-espresso">
            4. Your Data Principal Rights
          </h2>
          <p>
            In accordance with Chapter III of the Digital Personal Data Protection Act, 2023, you have the following rights as a Data Principal:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 bg-ivory rounded-xl border border-burgundy/15">
              <strong className="text-burgundy block text-xs">Right to Access Summary:</strong>
              <span className="text-xs text-espresso/75">Request a summary of your personal data processed by Trend Street and third-party identities with whom data was shared.</span>
            </div>
            <div className="p-3.5 bg-ivory rounded-xl border border-burgundy/15">
              <strong className="text-burgundy block text-xs">Right to Correction & Erasure:</strong>
              <span className="text-xs text-espresso/75">Request immediate correction of inaccurate contact data or deletion of data no longer required for statutory tax purposes.</span>
            </div>
            <div className="p-3.5 bg-ivory rounded-xl border border-burgundy/15">
              <strong className="text-burgundy block text-xs">Right to Withdraw Consent:</strong>
              <span className="text-xs text-espresso/75">Opt out of marketing communications or newsletter notifications at any time via a single-click unsubscribe link.</span>
            </div>
            <div className="p-3.5 bg-ivory rounded-xl border border-burgundy/15">
              <strong className="text-burgundy block text-xs">Right of Grievance Redressal:</strong>
              <span className="text-xs text-espresso/75">Direct unresolved data privacy concerns directly to our designated Statutory Grievance Officer.</span>
            </div>
          </div>
        </section>

        {/* 5. Statutory Grievance Redressal */}
        <section className="p-6 bg-white rounded-2xl border border-burgundy/20 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-burgundy font-bold text-sm">
            <FileText className="w-5 h-5" />
            <span>5. Statutory Grievance Officer & Contact Protocol</span>
          </div>
          <p className="text-xs text-espresso/80">
            Pursuant to Rule 3(2) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 and Section 13 of the DPDP Act 2023, the details of our designated Grievance Officer are set forth below:
          </p>
          <div className="p-4 bg-ivory rounded-xl border border-burgundy/10 text-xs space-y-1.5 text-espresso/80">
            <p><strong>Designated Grievance Officer:</strong> Rohan Kulkarni</p>
            <p><strong>Designation:</strong> Head of Legal, Compliance & Information Security</p>
            <p><strong>Entity:</strong> Trend Street Luxury Apparels Private Limited</p>
            <p><strong>Atelier Address:</strong> Plot 42, Waterfield Road, Pali Hill, Bandra West, Mumbai, Maharashtra 400050, India</p>
            <p><strong>Dedicated Email:</strong> <a href="mailto:grievance@trendstreet.in" className="text-burgundy underline font-semibold">grievance@trendstreet.in</a></p>
            <p><strong>Concierge Telephone:</strong> +91 98200 12345 (Monday to Saturday, 10:00 AM – 7:00 PM IST)</p>
            <p className="pt-1 text-[11px] text-espresso/60">
              Response SLA: All formal privacy grievances are acknowledged within 24 hours and fully investigated within 15 working days.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
