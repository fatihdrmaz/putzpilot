// Booking durum geçişleri ve ödeme sonrası işleme.
// Bu modül SADECE sunucuda kullanılır (service role) — PRD kuralı:
// durum geçişleri client'a asla açılmaz.

import { SupabaseClient } from "@supabase/supabase-js";
import { PriceRules } from "@/lib/pricing";
import { sendWhatsAppTemplate } from "@/lib/notifications";

export async function loadPriceRules(db: SupabaseClient): Promise<PriceRules> {
  const { data, error } = await db.from("price_rules").select("key, value");
  if (error) throw new Error(`price_rules okunamadı: ${error.message}`);
  const map = Object.fromEntries(data.map((r) => [r.key, Number(r.value)]));
  return {
    prepayment_pct: map.prepayment_pct ?? 20,
    fee_pct: map.fee_pct ?? 10,
    moving_pct: map.moving_pct ?? 20,
    construction_pct: map.construction_pct ?? 35,
    base_hour_price: map.base_hour_price ?? 25,
  };
}

// custom_id: "<bookingId>:<type>[:<cleanerId>]"
export function parseCustomId(customId: string): {
  bookingId: string;
  type: "prepayment" | "reservation_fee";
  cleanerId?: string;
} | null {
  const [bookingId, type, cleanerId] = customId.split(":");
  if (!bookingId || (type !== "prepayment" && type !== "reservation_fee")) return null;
  return { bookingId, type, cleanerId };
}

// Ödeme tamamlandığında (capture endpoint'i VEYA webhook — hangisi önce gelirse)
// çağrılır. İdempotent: payments.status 'completed' ise ikinci kez işlemez.
export async function processPaymentCompleted(
  db: SupabaseClient,
  params: {
    paypalOrderId: string;
    captureId: string | null;
    customId: string;
    webhookPayload?: unknown;
  }
): Promise<{ processed: boolean; reason?: string }> {
  const parsed = parseCustomId(params.customId);
  if (!parsed) return { processed: false, reason: "custom_id çözümlenemedi" };

  // İdempotency: bu order daha önce completed işlendiyse çık
  const { data: payment } = await db
    .from("payments")
    .select("id, status, type")
    .eq("paypal_order_id", params.paypalOrderId)
    .single();
  if (!payment) return { processed: false, reason: "payment kaydı yok" };
  if (payment.status === "completed") return { processed: true, reason: "zaten işlendi" };

  const { error: payErr } = await db
    .from("payments")
    .update({
      status: "completed",
      capture_id: params.captureId,
      webhook_payload: params.webhookPayload ?? null,
    })
    .eq("id", payment.id)
    .neq("status", "completed");
  if (payErr) throw new Error(`payment güncellenemedi: ${payErr.message}`);

  if (parsed.type === "prepayment") {
    // Müşteri ön ödemesi -> iş açık işlere düşer
    const { error } = await db
      .from("bookings")
      .update({ status: "open" })
      .eq("id", parsed.bookingId)
      .eq("status", "pending_payment");
    if (error) throw new Error(`booking open yapılamadı: ${error.message}`);
    return { processed: true };
  }

  // reservation_fee -> otomatik atama (manuel onay yok, PRD Bölüm 16)
  if (!parsed.cleanerId) return { processed: false, reason: "cleanerId eksik" };

  const { data: updated, error } = await db
    .from("bookings")
    .update({
      status: "assigned",
      cleaner_id: parsed.cleanerId,
      claim_locked_by: null,
      claim_locked_at: null,
    })
    .eq("id", parsed.bookingId)
    .eq("status", "open")
    .select("id, customer_id")
    .single();
  if (error) throw new Error(`booking atanamadı: ${error.message}`);

  // Müşteriye "temizlikçi atandı" bildirimi (tam adres artık RLS ile temizlikçiye açık)
  const { data: customer } = await db
    .from("profiles")
    .select("phone, language")
    .eq("id", updated.customer_id)
    .single();
  if (customer?.phone) {
    await sendWhatsAppTemplate({
      toPhone: customer.phone,
      template: "cleaner_assigned",
      language: customer.language === "tr" ? "tr" : "de",
    });
  }

  return { processed: true };
}
