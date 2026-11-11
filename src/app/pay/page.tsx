import React from "react";
import RazorpayCheckoutButton from "@/components/RazorpayCheckoutButton";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, CreditCard, Lock } from "lucide-react";

export const metadata = {
  title: "Razorpay Standard Checkout | OFFVYBE",
  description: "Test Razorpay Standard Web Checkout Integration",
};

export default function RazorpayPaymentTestPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1E1B18] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        <div className="mb-6">
          <Link
            href="/shop"
            className="inline-flex items-center text-sm font-medium text-stone-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shop
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="bg-[#8B1E3F] text-white p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-widest text-white/80 font-semibold">
                  Secure Checkout
                </span>
                <h1 className="text-2xl font-bold mt-1">OFFVYBE Order Payment</h1>
              </div>
              <ShieldCheck className="h-8 w-8 text-white/90" />
            </div>
            <p className="text-sm text-white/80 mt-2">
              Razorpay Standard Web Checkout Integration Demo
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/80 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-stone-600">Sample Item</span>
                <span className="font-semibold text-stone-900">Heavyweight Boxy Tee (Test)</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-stone-600">Currency</span>
                <span className="font-mono text-stone-800">INR (₹)</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-stone-600">Test Amount</span>
                <span className="text-lg font-bold text-[#8B1E3F]">₹500.00 (50,000 paise)</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <Lock className="h-3.5 w-3.5 text-stone-400" />
                <span>256-bit encrypted transactions powered by Razorpay</span>
              </div>

              <RazorpayCheckoutButton
                amount={50000}
                currency="INR"
                name="OFFVYBE Menswear"
                description="Test Order #OFF-TEST-001"
                buttonText="Pay ₹500 with Razorpay"
                className="w-full flex justify-center items-center py-3.5 px-6 rounded-xl bg-[#8B1E3F] hover:bg-[#721833] text-white font-semibold shadow-md transition-all cursor-pointer"
              />
            </div>

            <div className="border-t border-stone-200 pt-4 text-xs text-stone-500 space-y-1">
              <p className="font-medium text-stone-700">Test Mode Instructions:</p>
              <ul className="list-disc list-inside space-y-0.5 text-stone-600">
                <li>You can use test cards or test UPI IDs (e.g. <code>success@razorpay</code>).</li>
                <li>Signature verification is validated by <code>/api/verify-payment</code>.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
