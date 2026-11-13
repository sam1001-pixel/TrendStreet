import { NextRequest } from "next/server";
import { processShiprocketWebhook, handleWebhookGet } from "@/lib/shipping/webhook";

export const dynamic = "force-dynamic";

/**
 * Shiprocket Webhook Receiver
 * Note: Shiprocket settings advise using https://offvybe.com/api/webhooks/tracking
 * to avoid reserved brand keywords in the URL.
 */
export async function POST(req: NextRequest) {
  return processShiprocketWebhook(req);
}

export async function GET() {
  return handleWebhookGet();
}
