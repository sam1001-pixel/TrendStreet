import { NextRequest, NextResponse } from "next/server";
import { getRazorpayClient, verifyRazorpayPaymentSignature } from "@/lib/razorpay";
import { OrderInputError, placeOrder, sendPlacedOrderEmail, DeliveryMethod } from "@/lib/orders";

export const dynamic = "force-dynamic";

const DELIVERY_METHODS: DeliveryMethod[] = ["standard", "express", "vip_courier"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderData } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing required Razorpay payment signature parameters." }, { status: 400 });
    }

    // 1. Constant-time HMAC-SHA256 signature verification
    const isValidSignature = verifyRazorpayPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValidSignature) {
      console.warn(`[Razorpay Signature Verification Failed] Order: ${razorpay_order_id}, Payment: ${razorpay_payment_id}`);
      return NextResponse.json({ error: "Payment verification failed: Invalid cryptographic signature." }, { status: 400 });
    }

    // 2. Persist with server-recomputed prices (client totals are ignored)
    try {
      const deliveryMethod: DeliveryMethod = DELIVERY_METHODS.includes(orderData?.deliveryMethod)
        ? orderData.deliveryMethod
        : "standard";

      // What was actually charged, straight from Razorpay (not from the browser).
      const rzpOrder = await getRazorpayClient().orders.fetch(razorpay_order_id);
      const paidAmountMinor = Number(rzpOrder.amount_paid || rzpOrder.amount);

      const order = await placeOrder({
        items: (orderData?.items || []).map((it: any) => ({
          productId: it.productId,
          size: it.selectedSize ?? it.size,
          color: it.selectedColor ?? it.color,
          quantity: it.quantity,
        })),
        customer: orderData?.customer,
        promoCode: orderData?.promoCode,
        deliveryMethod,
        payment: {
          provider: "RAZORPAY",
          gatewayOrderId: razorpay_order_id,
          gatewayPaymentId: razorpay_payment_id,
          gatewaySignature: razorpay_signature,
          paidAmountMinor,
        },
      });

      if (order.amountMismatch) {
        console.error(`[PAYMENT AMOUNT MISMATCH — REVIEW ORDER ${order.orderNumber}] paid ${paidAmountMinor}, expected ${order.pricing.totalMinor}`);
      }

      if (!order.alreadyExisted) {
        void sendPlacedOrderEmail(order, "Razorpay (UPI / Card / Net Banking)", razorpay_payment_id);
      }

      return NextResponse.json({
        success: true,
        verified: true,
        saved: true,
        orderNumber: order.orderNumber,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      });
    } catch (dbError) {
      // The money has moved, so the shopper must still see success — but this needs manual follow-up.
      console.error(
        `[ORDER NOT SAVED — ACTION REQUIRED] Razorpay payment ${razorpay_payment_id} (order ${razorpay_order_id}) verified but not persisted:`,
        dbError instanceof OrderInputError ? dbError.message : dbError
      );
      return NextResponse.json({
        success: true,
        verified: true,
        saved: false,
        orderNumber: null,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      });
    }
  } catch (error: any) {
    console.error("[Razorpay Verify Error]:", error);
    return NextResponse.json({ error: "Payment verification encountered an internal error." }, { status: 500 });
  }
}
