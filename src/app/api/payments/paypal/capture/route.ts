import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureOrder, isPayPalConfigured } from "@/lib/paypal";
import { processPaymentCompleted } from "@/lib/bookings";

// Müşteri/temizlikçi PayPal onayından döndüğünde çağrılır: order'ı capture
// eder ve booking'i işler. Webhook aynı işlemi yedek olarak yapar (idempotent).
export async function POST(request: NextRequest) {
  if (!isPayPalConfigured()) {
    return NextResponse.json({ error: "PayPal yapılandırılmadı" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const { order_id } = await request.json();
  if (!order_id) return NextResponse.json({ error: "order_id gerekli" }, { status: 400 });

  const result = await captureOrder(order_id);
  if (result.status !== "COMPLETED" || !result.customId) {
    return NextResponse.json(
      { error: `Ödeme tamamlanmadı (${result.status})` },
      { status: 402 }
    );
  }

  const admin = createAdminClient();
  const outcome = await processPaymentCompleted(admin, {
    paypalOrderId: result.orderId,
    captureId: result.captureId,
    customId: result.customId,
  });

  return NextResponse.json(outcome);
}
