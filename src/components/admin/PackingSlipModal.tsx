"use client";

import React from "react";
import { Printer, X, ShieldCheck } from "lucide-react";
import { Order } from "@/types/store";

interface PackingSlipModalProps {
  order: Order | null;
  onClose: () => void;
}

export function PackingSlipModal({ order, onClose }: PackingSlipModalProps) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalItemsCount = order.items.reduce((acc, it) => acc + it.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Controls Bar (Hidden during print) */}
        <div className="print:hidden bg-espresso p-4 text-ivory flex items-center justify-between border-b border-burgundy/40">
          <div className="flex items-center space-x-2">
            <span className="font-serif font-bold text-sm text-ivory">
              Atelier Packing Slip Preview
            </span>
            <span className="text-xs font-mono text-gold px-2 py-0.5 bg-burgundy/40 rounded border border-gold/30">
              {order.orderNumber}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-burgundy text-gold text-xs font-bold uppercase tracking-wider rounded-lg border border-gold/40 flex items-center gap-1.5 hover:bg-burgundy/90 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Packing Slip</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-ivory/60 hover:text-ivory hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Packing Slip Canvas */}
        <div className="p-8 sm:p-10 overflow-y-auto font-sans text-espresso bg-white" id="packing-slip-printable">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-espresso pb-6">
            <div>
              <h1 className="font-serif text-2xl font-bold tracking-tight text-espresso uppercase">
                TREND STREET
              </h1>
              <p className="text-[11px] uppercase tracking-widest text-espresso/70 mt-0.5">
                Luxury Menswear Atelier • Mumbai
              </p>
              <p className="text-[10px] text-espresso/60 mt-2 font-mono">
                GSTIN: 27AABCT8821Q1ZP | concierge@trendstreet.in
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-espresso text-ivory text-[10px] font-bold uppercase tracking-widest rounded">
                Official Dispatch Slip
              </span>
              <div className="mt-2 space-y-0.5 text-xs font-mono">
                <p>
                  Order: <strong className="text-sm font-bold">{order.orderNumber}</strong>
                </p>
                <p className="text-espresso/70">
                  Date: {new Date(order.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                {order.trackingNumber && (
                  <p className="text-emerald-700 font-bold">
                    AWB: {order.trackingNumber}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Shipping & Payment Meta */}
          <div className="grid grid-cols-2 gap-6 my-6 p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">
                Ship To Address
              </p>
              <p className="font-bold text-sm text-espresso">{order.customer.fullName}</p>
              <p className="text-espresso/80 mt-0.5">
                {order.customer.address}
                {order.customer.apartment ? `, ${order.customer.apartment}` : ""}
              </p>
              <p className="text-espresso/80">
                {order.customer.city} — {order.customer.postalCode}
              </p>
              <p className="text-espresso/70 mt-1 font-mono">
                Phone: {order.customer.phone}
              </p>
            </div>

            <div className="border-l border-gray-200 pl-6 space-y-1">
              <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">
                Fulfilment Protocol
              </p>
              <p>
                Delivery Mode:{" "}
                <span className="font-bold uppercase text-espresso">
                  {order.deliveryMethod?.replace("_", " ") || "Standard Express"}
                </span>
              </p>
              <p>
                Payment:{" "}
                <span className="font-bold uppercase text-espresso">
                  {order.paymentMethod === "cod" ? "Cash On Delivery" : "Prepaid (Razorpay)"}
                </span>
              </p>
              <p>
                Total Units: <span className="font-bold">{totalItemsCount} pieces</span>
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-espresso/20 rounded-xl overflow-hidden my-6">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-espresso text-ivory text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Product & Variant Description</th>
                  <th className="p-3 text-center">Size</th>
                  <th className="p-3 text-center">Color</th>
                  <th className="p-3 text-right">Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {order.items.map((it, idx) => (
                  <tr key={`${it.productId}-${idx}`} className="hover:bg-gray-50">
                    <td className="p-3 font-mono text-gray-500">{idx + 1}</td>
                    <td className="p-3">
                      <p className="font-bold text-espresso">{it.productName}</p>
                      <p className="text-[10px] font-mono text-gray-500">
                        SKU: {it.productId}-{it.selectedSize}
                      </p>
                    </td>
                    <td className="p-3 text-center font-bold">{it.selectedSize}</td>
                    <td className="p-3 text-center text-gray-700">{it.selectedColor}</td>
                    <td className="p-3 text-right font-bold text-sm">{it.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Verification & QC Footer */}
          <div className="mt-8 pt-6 border-t border-dashed border-gray-300 grid grid-cols-2 gap-8 text-[11px]">
            <div className="space-y-2">
              <p className="font-bold uppercase tracking-wider text-gray-500">
                Atelier Quality Control Check
              </p>
              <div className="flex items-center gap-2 text-gray-600">
                <span className="w-4 h-4 rounded border border-gray-400 inline-block" />
                <span>Fabric weight & seam inspection verified</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <span className="w-4 h-4 rounded border border-gray-400 inline-block" />
                <span>Custom garment dust-bag & tags enclosed</span>
              </div>
            </div>

            <div className="text-right space-y-4">
              <p className="text-gray-500 uppercase tracking-wider">
                Authorized Packing Officer
              </p>
              <div className="pt-6 border-b border-gray-400 w-44 ml-auto" />
              <p className="text-[10px] text-gray-500">Signature / Dispatch Stamp</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
