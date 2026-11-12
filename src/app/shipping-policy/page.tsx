import React from "react";
import Link from "next/link";
import { Truck, Package, Clock, ShieldCheck, MapPin, ArrowLeft } from "lucide-react";
import { getCachedStorefront } from "@/lib/catalog";
import { DEFAULT_STORE_CONFIG, rupees } from "@/lib/store-config";

// Charges and contact details are read from Admin → Settings, so this page never goes out of date.
export const revalidate = 300;

export const metadata = {
  title: "Shipping & Logistics Policy | OFFVYBE",
  description: "OFFVYBE shipping timelines, courier partners (Blue Dart Apex & Delhivery Air), and domestic delivery coverage across India.",
};

export default async function ShippingPolicyPage() {
  const { settings } = await getCachedStorefront();
  const cfg = settings.config ?? DEFAULT_STORE_CONFIG;
  const phone = settings.contactInfo?.phone || "";
  const email = settings.contactInfo?.email || "concierge@offvybe.in";
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
          <Truck className="w-4 h-4" />
          <span>India-First Express Logistics</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-espresso">
          Shipping & Logistics Policy
        </h1>
        <p className="text-xs sm:text-sm text-espresso/70 leading-relaxed font-light">
          Effective Date: January 1, 2026 • Dispatched from Jodhpur Atelier, Rajasthan
        </p>
        <p className="text-xs text-espresso/80 leading-relaxed">
          At OFFVYBE, every garment is handled as an architectural piece. From fabric steam-finishing to hardware protection,
          our logistics chain guarantees white-glove doorstep delivery across 19,000+ Indian postal PIN codes.
        </p>
      </div>

      {/* Policy Sections */}
      <div className="space-y-10 text-xs sm:text-sm text-espresso/85 leading-relaxed">
        {/* 1. Courier Partners & Tiered Transit Times */}
        <section className="space-y-4">
          <h2 className="font-serif text-xl font-bold text-espresso">
            1. Dedicated Courier Partners & Transit Timelines
          </h2>
          <p>
            We partner exclusively with India&rsquo;s premier express logistics networks—<strong>Blue Dart Apex</strong> and <strong>Delhivery Air</strong>—to ensure swift, insured transit:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-white rounded-2xl border border-burgundy/15 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-burgundy">Metro Hubs</span>
                <span className="text-[11px] bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded">2–3 Days</span>
              </div>
              <p className="text-xs text-espresso/70">
                Mumbai, Delhi NCR, Bengaluru, Hyderabad, Chennai, Kolkata, and Pune.
              </p>
              <span className="text-[11px] font-semibold text-espresso block">Courier: Blue Dart Apex (Air)</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-burgundy/15 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-burgundy">Tier 1 & 2 Cities</span>
                <span className="text-[11px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">3–4 Days</span>
              </div>
              <p className="text-xs text-espresso/70">
                Ahmedabad, Chandigarh, Jaipur, Lucknow, Kochi, Surat, Nagpur, and Indore.
              </p>
              <span className="text-[11px] font-semibold text-espresso block">Courier: Delhivery Express</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-burgundy/15 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-burgundy">Rest of India</span>
                <span className="text-[11px] bg-gold/30 text-espresso font-bold px-2 py-0.5 rounded">4–6 Days</span>
              </div>
              <p className="text-xs text-espresso/70">
                Regional hubs, state interiors, and northeastern territories.
              </p>
              <span className="text-[11px] font-semibold text-espresso block">Courier: Delhivery / Speed Post</span>
            </div>
          </div>
        </section>

        {/* 2. Shipping Charges & Free Courier Threshold */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-espresso">
            2. Domestic Shipping Rates & Free Delivery
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse border border-burgundy/15">
              <thead>
                <tr className="bg-ivory text-espresso font-serif">
                  <th className="p-3 border border-burgundy/15">Order Value Threshold</th>
                  <th className="p-3 border border-burgundy/15">Standard ({cfg.shipping.standardDays})</th>
                  <th className="p-3 border border-burgundy/15">{cfg.shipping.expressEnabled ? `Express (${cfg.shipping.expressDays})` : "Express (currently unavailable)"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-burgundy/10">
                <tr>
                  <td className="p-3 border border-burgundy/15 font-semibold text-burgundy">Orders of {rupees(cfg.shipping.freeOver)} and above</td>
                  <td className="p-3 border border-burgundy/15 font-bold text-green-800">COMPLIMENTARY (FREE)</td>
                  <td className="p-3 border border-burgundy/15 font-bold text-green-800">COMPLIMENTARY (FREE)</td>
                </tr>
                <tr>
                  <td className="p-3 border border-burgundy/15">Orders below {rupees(cfg.shipping.freeOver)}</td>
                  <td className="p-3 border border-burgundy/15">{rupees(cfg.shipping.standard)}</td>
                  <td className="p-3 border border-burgundy/15">{cfg.shipping.expressEnabled ? rupees(cfg.shipping.express) : "—"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. Atelier Packaging */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-espresso flex items-center gap-2">
            <Package className="w-5 h-5 text-burgundy" />
            <span>3. Sustainable Luxury Atelier Packaging</span>
          </h2>
          <p>
            Every order is dispatched in moisture-sealed cedar garment protectors with heavy-gauge recyclable outer boxes.
            Selvedge denim is packed flat to protect the natural rigid crease lines and chain-stitch hems.
          </p>
        </section>

        {/* 4. Tracking & Notification Protocols */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-espresso flex items-center gap-2">
            <Clock className="w-5 h-5 text-burgundy" />
            <span>4. Order Dispatch & Live SMS Tracking</span>
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-xs text-espresso/75">
            <li><strong>Processing Time:</strong> Orders are verified, hand-inspected, and packed within 24 hours of placement (excluding Sundays and national holidays).</li>
            <li><strong>Tracking Notification:</strong> As soon as the courier partner scans your parcel at our Jodhpur fulfillment hub, an Air Waybill (AWB) number and live tracking link is transmitted to your registered mobile and email.</li>
            <li><strong>OTP Verification:</strong> For high-value allocations and Cash on Delivery parcels, an OTP is generated upon delivery to ensure handover to the authorized recipient.</li>
          </ul>
        </section>

        {/* 5. Address Revisions & Contact */}
        <section className="p-6 bg-white rounded-2xl border border-burgundy/20 shadow-xs space-y-3">
          <h3 className="font-serif font-bold text-espresso text-base">
            Need to Amend a Delivery Address?
          </h3>
          <p className="text-xs text-espresso/75">
            If you need to adjust your delivery address or contact number, please contact our support team within 4 hours of placing your order:
          </p>
          <div className="pt-1 flex flex-wrap gap-4 text-xs font-semibold text-burgundy">
            <span>Email: <a href={`mailto:${email}`} className="underline">{email}</a></span>
            {phone && <span>WhatsApp / Phone: {phone}</span>}
          </div>
        </section>
      </div>
    </div>
  );
}
