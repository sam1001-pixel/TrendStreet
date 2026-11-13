import { NextRequest } from "next/server";
import { processShiprocketWebhook, handleWebhookGet } from "@/lib/shipping/webhook";

export const dynamic = "force-dynamic";

/**
 * Logistics Webhook Receiver (Alternative Alias)
 * https://offvybe.com/api/webhooks/logistics
 */
export async function POST(req: NextRequest) {
  return processShiprocketWebhook(req);
}

export async function GET() {
  return handleWebhookGet();
}
