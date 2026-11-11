"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  Send,
  CheckCircle,
  FileText,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Sizing & Fit Advice",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setForm({ name: "", email: "", phone: "", subject: "Sizing & Fit Advice", message: "" });
    }, 1000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
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
          <Sparkles className="w-4 h-4" />
          <span>Customer care</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-espresso">
          Contact Us & Statutory Grievance Redressal
        </h1>
        <p className="text-xs sm:text-sm text-espresso/70 leading-relaxed font-light">
          Bandra West Atelier, Mumbai • Mon–Sat 10:00 AM – 7:00 PM IST
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Contact Information & Grievance Card */}
        <div className="lg:col-span-5 space-y-6">
          {/* Atelier Location */}
          <div className="p-6 bg-white rounded-2xl border border-burgundy/15 shadow-xs space-y-4 text-xs">
            <h3 className="font-serif text-base font-bold text-espresso flex items-center gap-2">
              <MapPin className="w-4 h-4 text-burgundy" />
              <span>Flagship Atelier & Studio</span>
            </h3>
            <p className="text-espresso/80 leading-relaxed">
              <strong>OFFVYBE</strong><br />
              Plot 42, Waterfield Road, Pali Hill,<br />
              Bandra West, Mumbai, Maharashtra 400050, India
            </p>
            <div className="pt-2 border-t border-ivory-dark space-y-2 text-espresso/75">
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-gold flex-shrink-0" />
                <span>+91 98200 12345 (Calls & WhatsApp)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-gold flex-shrink-0" />
                <span>concierge@offvybe.in</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-gold flex-shrink-0" />
                <span>Monday – Saturday: 10:00 AM – 7:00 PM IST</span>
              </div>
            </div>
          </div>

          {/* Statutory Grievance Officer */}
          <div className="p-6 bg-ivory rounded-2xl border border-burgundy/20 shadow-xs space-y-3 text-xs">
            <div className="flex items-center space-x-2 text-burgundy font-bold">
              <FileText className="w-4 h-4" />
              <span className="font-serif text-sm">Statutory Grievance Officer</span>
            </div>
            <p className="text-[11px] text-espresso/70 leading-relaxed">
              Appointed under Rule 3(2) of the Information Technology (Intermediary Guidelines) Rules, 2021 and Section 13 of the Digital Personal Data Protection Act 2023.
            </p>
            <div className="p-3 bg-white rounded-xl border border-burgundy/10 space-y-1 text-espresso/85">
              <p><strong>Name:</strong> Rohan Kulkarni</p>
              <p><strong>Designation:</strong> Head of Legal & Grievance Redressal</p>
              <p><strong>Direct Email:</strong> <a href="mailto:grievance@offvybe.in" className="text-burgundy underline font-semibold">grievance@offvybe.in</a></p>
              <p><strong>Response Timeline:</strong> Acknowledged within 24 hours; resolved within 15 working days.</p>
            </div>
          </div>
        </div>

        {/* Interactive Inquiry Form */}
        <div className="lg:col-span-7">
          <div className="p-6 sm:p-8 bg-white rounded-3xl border border-burgundy/15 shadow-sm space-y-5">
            <h3 className="font-serif text-xl font-bold text-espresso">
              Send an Atelier Inquiry
            </h3>
            <p className="text-xs text-espresso/70">
              Whether you need personalized sizing advice, custom hemming on selvedge denim, or order tracking support, our pattern masters respond within 4 hours.
            </p>

            {submitted ? (
              <div className="p-6 bg-green-50 border border-green-200 rounded-2xl text-center space-y-3 animate-in zoom-in-95 duration-200">
                <div className="w-12 h-12 rounded-full bg-green-100 text-green-800 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <h4 className="font-serif text-lg font-bold text-green-900">Inquiry Transmitted</h4>
                <p className="text-xs text-green-800/80 max-w-sm mx-auto">
                  Thanks for contacting OFFVYBE. Our support team has received your note and will be in touch shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="pt-2 text-xs font-bold text-burgundy underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-espresso mb-1">Your Legal Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Your full name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-ivory px-3.5 py-2.5 rounded-lg border border-burgundy/20 text-espresso focus:outline-none focus:border-burgundy"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-espresso mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full bg-ivory px-3.5 py-2.5 rounded-lg border border-burgundy/20 text-espresso focus:outline-none focus:border-burgundy"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-espresso mb-1">Phone / WhatsApp Number</label>
                    <input
                      type="tel"
                      placeholder="+91 Mobile number"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full bg-ivory px-3.5 py-2.5 rounded-lg border border-burgundy/20 text-espresso focus:outline-none focus:border-burgundy"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-subject" className="block font-semibold text-espresso mb-1">Inquiry Category *</label>
                    <select
                      id="contact-subject"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="w-full bg-ivory px-3.5 py-2.5 rounded-lg border border-burgundy/20 text-espresso focus:outline-none focus:border-burgundy cursor-pointer"
                    >
                      <option value="Sizing & Fit Advice">Sizing & Silhouette Consultation</option>
                      <option value="Order & Logistics Tracking">Order & Courier Tracking (Blue Dart / Delhivery)</option>
                      <option value="30-Day Return / Size Swap">30-Day Return / Size Exchange</option>
                      <option value="Selvedge Hemming & Repairs">Denim Hemming & Seam Care</option>
                      <option value="Statutory Grievance">Statutory Legal Grievance</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-espresso mb-1">Your Message or Order Reference *</label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Tell us about your sizing questions or order inquiries..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full bg-ivory p-3.5 rounded-lg border border-burgundy/20 text-espresso focus:outline-none focus:border-burgundy leading-relaxed"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] text-green-800 font-semibold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Protected under DPDP Act 2023</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="py-3 px-8 bg-burgundy hover:bg-crimson text-ivory text-xs font-bold uppercase tracking-[0.2em] rounded-lg transition-colors flex items-center gap-2 shadow-md disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Transmitting...</span>
                    ) : (
                      <>
                        <span>Submit Inquiry</span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
