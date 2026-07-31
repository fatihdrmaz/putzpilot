import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  decideCustomerCancellation,
  decideCleanerCancellation,
  RefundDecision,
  SUSPENSION_THRESHOLD,
} from "@/lib/pricing";
import { isPayPalConfigured, refundCapture } from "@/lib/paypal";
import { sendWhatsAppTemplate } from "@/lib/notifications";

// İptal — PRD Bölüm 11 kuralları. İade tutarları sunucuda hesaplanır,
// PayPal Refunds API ile orijinal ödemeye iade edilir.
export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/bookings/[id]/cancel">
) {
  const { id } = await ctx.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const reason: string | null = body.reason ?? null;

  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select(
      "id, status, customer_id, cleaner_id, scheduled_date, start_time, prepayment_amount, reservation_fee_amount"
    )
    .eq("id", id)
    .single();
  if (!booking) return NextResponse.json({ error: "Rezervasyon bulunamadı" }, { status: 404 });

  const cancellableStates = ["pending_payment", "open", "assigned"];
  if (!cancellableStates.includes(booking.status)) {
    return NextResponse.json(
      { error: `Bu durumda iptal edilemez: ${booking.status}` },
      { status: 409 }
    );
  }

  const isCustomer = booking.customer_id === user.id;
  const isCleaner = booking.cleaner_id === user.id;
  if (!isCustomer && !isCleaner) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const start = new Date(`${booking.scheduled_date}T${booking.start_time}`);
  const hoursUntilStart = (start.getTime() - Date.now()) / 3_600_000;

  const decision: RefundDecision = isCustomer
    ? decideCustomerCancellation(hoursUntilStart)
    : decideCleanerCancellation(hoursUntilStart, false);

  // Tamamlanmış ödemeleri bul
  const { data: payments } = await admin
    .from("payments")
    .select("id, payer, type, amount, capture_id, status")
    .eq("booking_id", booking.id)
    .eq("status", "completed");

  const refunds: { payer: string; amount: number }[] = [];

  async function doRefund(payer: "customer" | "cleaner", pct: number) {
    const payment = payments?.find(
      (pp) =>
        pp.payer === payer &&
        pp.type === (payer === "customer" ? "prepayment" : "reservation_fee") &&
        pp.capture_id
    );
    if (!payment || pct <= 0) return;
    const amount = Math.round(Number(payment.amount) * pct) / 100;
    if (isPayPalConfigured()) {
      await refundCapture({
        captureId: payment.capture_id,
        amount,
        noteToPayer: "PutzPilot — Stornierung / iptal iadesi",
      });
    }
    await admin.from("payments").insert({
      booking_id: booking!.id,
      payer,
      type: "refund",
      provider: "paypal",
      amount: -amount,
      status: isPayPalConfigured() ? "refunded" : "created",
    });
    refunds.push({ payer, amount });
  }

  await doRefund("customer", decision.customerRefundPct);
  await doRefund("cleaner", decision.cleanerRefundPct);

  // Temizlikçi iptali: iş yeniden açık işlere düşer (PRD 11.2), müşteri iptali: kapanır
  if (isCleaner) {
    await admin
      .from("bookings")
      .update({
        status: "open",
        cleaner_id: null,
        claim_locked_by: null,
        claim_locked_at: null,
      })
      .eq("id", booking.id);
  } else {
    await admin.from("bookings").update({ status: "cancelled" }).eq("id", booking.id);
  }

  await admin.from("cancellations").insert({
    booking_id: booking.id,
    cancelled_by: isCustomer ? "customer" : "cleaner",
    reason,
    applied_rule: decision.rule,
    customer_refund_amount: refunds.find((r) => r.payer === "customer")?.amount ?? 0,
    cleaner_refund_amount: refunds.find((r) => r.payer === "cleaner")?.amount ?? 0,
  });

  // İhtar puanı (temizlikçi geç iptali); 3 puanda askıya alma
  if (isCleaner && decision.penaltyPoints > 0) {
    await admin.from("penalties").insert({
      cleaner_id: user.id,
      booking_id: booking.id,
      points: decision.penaltyPoints,
      reason: decision.rule,
    });
    const { data: allPenalties } = await admin
      .from("penalties")
      .select("points")
      .eq("cleaner_id", user.id);
    const total = (allPenalties ?? []).reduce((s, x) => s + x.points, 0);
    if (total >= SUSPENSION_THRESHOLD) {
      await admin
        .from("cleaner_profiles")
        .update({ verification_status: "rejected" })
        .eq("user_id", user.id);
    }
  }

  // Karşı tarafa bildirim
  const otherPartyId = isCustomer ? booking.cleaner_id : booking.customer_id;
  if (otherPartyId) {
    const { data: other } = await admin
      .from("profiles")
      .select("phone, language")
      .eq("id", otherPartyId)
      .single();
    if (other?.phone) {
      await sendWhatsAppTemplate({
        toPhone: other.phone,
        template: "booking_cancelled",
        language: other.language === "tr" ? "tr" : "de",
      });
    }
  }

  return NextResponse.json({ rule: decision.rule, refunds });
}
