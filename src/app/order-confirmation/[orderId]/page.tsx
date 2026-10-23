"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle,
  Truck,
  Package,
  Calendar,
  MapPin,
  ArrowRight,
  Printer,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatPrice } from "@/lib/pricing";

export default function OrderConfirmationPage() {
  const { orderId } = useParams();
  const { orders } = useStore();

  const order = orders.find((o) => o.id === orderId);

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-burgundy/10 text-burgundy flex items-center justify-center mx-auto">
          <Package className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-espresso">Order Record Not Found</h1>
        <p className="text-espresso/70 text-sm max-w-md mx-auto">
          We could not locate an active order associated with this reference. If you recently placed an order, please review your client profile or contact our studio concierge.
        </p>
        <div className="flex items-center justify-center gap-4 pt-2">
          <Link
            href="/profile"
            className="px-6 py-2.5 bg-burgundy text-ivory text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-crimson transition-colors"
          >
            Client Profile
          </Link>
          <Link
            href="/shop"
            className="px-6 py-2.5 border border-burgundy/30 text-espresso text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-burgundy/5 transition-colors"
          >
            Explore Collection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      {/* Success Banner */}
      <div className="text-center space-y-3 bg-white p-8 sm:p-12 rounded-3xl border border-burgundy/15 shadow-sm">
        <div className="w-16 h-16 bg-green-100 text-green-800 rounded-full flex items-center justify-center mx-auto mb-2 animate-in zoom-in duration-300">
          <CheckCircle className="w-9 h-9" />
        </div>
        <span className="text-xs font-bold uppercase tracking-[0.25em] text-crimson block">
          Order Confirmed & Allocated
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-espresso">
          Thank You, {order.customer.fullName}
        </h1>
        <p className="text-xs text-espresso/70 max-w-md mx-auto leading-relaxed">
          Your garment allocation has been registered with our Bandra West Atelier in Mumbai. Our master craftsmen are inspecting fabric handfeel and hardware prior to express courier dispatch.
        </p>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-3 text-xs">
          <span className="p-2.5 bg-ivory rounded-lg border border-burgundy/15 font-mono text-burgundy font-bold">
            Order #{order.orderNumber}
          </span>
          <span className="p-2.5 bg-ivory rounded-lg border border-burgundy/15 font-mono text-espresso font-semibold">
            Tracking: {order.trackingNumber}
          </span>
        </div>
      </div>

      {/* Order Status Timeline */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-burgundy/15 shadow-xs space-y-6">
        <h3 className="font-serif text-lg font-bold text-espresso pb-3 border-b border-burgundy/10 flex items-center justify-between">
          <span>Atelier Fulfillment Status</span>
          <span className="text-xs font-semibold px-3 py-1 bg-burgundy/10 text-burgundy rounded-full">
            {order.status}
          </span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-ivory rounded-xl border border-burgundy/10 space-y-1">
            <Calendar className="w-4 h-4 text-burgundy mb-2" />
            <span className="font-bold text-espresso block">Estimated Delivery</span>
            <p className="text-espresso/70">{order.estimatedDelivery}</p>
          </div>

          <div className="p-4 bg-ivory rounded-xl border border-burgundy/10 space-y-1">
            <Truck className="w-4 h-4 text-burgundy mb-2" />
            <span className="font-bold text-espresso block">Courier Logistics</span>
            <p className="text-espresso/70">
              {order.deliveryMethod === "vip_courier" ? "VIP Express Courier" : "Standard Ground"}
            </p>
          </div>

          <div className="p-4 bg-ivory rounded-xl border border-burgundy/10 space-y-1">
            <MapPin className="w-4 h-4 text-burgundy mb-2" />
            <span className="font-bold text-espresso block">Destination Address</span>
            <p className="text-espresso/70 truncate">{order.customer.address}, {order.customer.city}</p>
          </div>
        </div>
      </div>

      {/* Ordered Items Summary */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-burgundy/15 shadow-xs space-y-6">
        <h3 className="font-serif text-lg font-bold text-espresso pb-3 border-b border-burgundy/10">
          Garments in this Allocation ({order.items.length})
        </h3>

        <div className="divide-y divide-ivory-dark space-y-4">
          {order.items.map((item, idx) => (
            <div key={idx} className="pt-4 first:pt-0 flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-4">
                <Image
                  src={item.image}
                  alt={item.productName}
                  width={64}
                    height={80}
                    className="w-16 h-20 object-cover rounded bg-ivory-dark"
                  />
                <div className="text-xs space-y-1">
                  <h4 className="font-serif font-bold text-espresso">{item.productName}</h4>
                  <p className="text-espresso/60">
                    Size: <strong>{item.selectedSize}</strong> | Color: <strong>{item.selectedColor}</strong> | Qty: {item.quantity}
                  </p>
                </div>
              </div>

              <span className="text-sm font-bold text-burgundy">
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        {/* Cost Breakdown */}
        <div className="pt-4 border-t border-burgundy/15 space-y-2 text-xs text-espresso/80">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-crimson font-medium">
              <span>Privilege Discount ({order.promoCode})</span>
              <span>-{formatPrice(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Courier Logistics</span>
            <span>{order.shipping === 0 ? "Complimentary" : formatPrice(order.shipping)}</span>
          </div>
          <div className="flex justify-between">
            <span>GST (12% Statutory Tax)</span>
            <span>{formatPrice(order.tax)}</span>
          </div>
          <div className="pt-3 border-t border-ivory-dark flex justify-between text-base font-bold text-burgundy">
            <span>Total Settled</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <button
          onClick={() => window.print()}
          className="w-full sm:w-auto py-3 px-6 bg-white border border-burgundy/30 hover:border-burgundy text-burgundy text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Printer className="w-4 h-4" />
          <span>Print Sartorial Receipt</span>
        </button>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <Link
            href="/profile"
            className="flex-1 sm:flex-initial py-3 px-6 bg-espresso hover:bg-black text-ivory text-xs font-semibold uppercase tracking-wider rounded-lg text-center transition-colors"
          >
            View in Profile
          </Link>
          <Link
            href="/shop"
            className="flex-1 sm:flex-initial py-3 px-6 bg-burgundy hover:bg-crimson text-ivory text-xs font-bold uppercase tracking-wider rounded-lg text-center transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
