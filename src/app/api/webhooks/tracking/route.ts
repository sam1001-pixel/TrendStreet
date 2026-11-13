import { NextRequest } from "next/server";
import { processShiprocketWebhook, handleWebhookGet } from "@/lib/shipping/webhook";

export const dynamic = "force-dynamic";

/**
 * Logistics Tracking Webhook Receiver
 *
 * Recommended endpoint for Shiprocket:
 * https://offvybe.com/api/webhooks/tracking
 *
 * (Adheres to Shiprocket's rule prohibiting keywords 'shiprocket', 'kartrocket', 'sr', 'kr' in the URL)
 */
export async function POST(req: NextRequest) {
  return processShiprocketWebhook(req);
}

export async function GET() {
  return handleWebhookGet();
}
