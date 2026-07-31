import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/paypal";
import { processPaymentCompleted } from "@/lib/bookings";

// PayPal Webhooks — PRD kuralı: imza doğrulaması ve idempotency zorunlu.
// Dinlenen event: PAYMENT.CAPTURE.COMPLETED
export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  const verified = await verifyWebhookSignature(request.headers, rawBody);
  if (!verified) {
    return NextResponse.json({ error: "İmza doğrulanamadı" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    const resource = event.resource;
    const customId: string | undefined = resource?.custom_id;
    // capture event'inde order id supplementary_data'da gelir
    const orderId: string | undefined =
      resource?.supplementary_data?.related_ids?.order_id;

    if (customId && orderId) {
      const admin = createAdminClient();
      await processPaymentCompleted(admin, {
        paypalOrderId: orderId,
        captureId: resource.id ?? null,
        customId,
        webhookPayload: event,
      });
    }
  }

  // PayPal'a her durumda 200 dönülür ki event tekrar tekrar gönderilmesin
  // (işlenemeyen event'ler payments tablosundan takip edilir)
  return NextResponse.json({ received: true });
}
