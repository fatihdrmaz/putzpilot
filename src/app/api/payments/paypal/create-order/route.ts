import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createOrder, isPayPalConfigured } from "@/lib/paypal";

// Ön ödeme (%20, müşteri) veya rezervasyon ücreti (%10, temizlikçi) için
// PayPal order oluşturur. Tutar DB'deki booking'den okunur.
export async function POST(request: NextRequest) {
  if (!isPayPalConfigured()) {
    return NextResponse.json(
      { error: "PayPal henüz yapılandırılmadı (env anahtarları eksik)" },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const { booking_id, type } = await request.json();
  if (!booking_id || (type !== "prepayment" && type !== "reservation_fee")) {
    return NextResponse.json({ error: "booking_id ve geçerli type gerekli" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: booking, error } = await admin
    .from("bookings")
    .select(
      "id, customer_id, status, prepayment_amount, reservation_fee_amount, claim_locked_by, claim_locked_at"
    )
    .eq("id", booking_id)
    .single();
  if (error || !booking) {
    return NextResponse.json({ error: "Rezervasyon bulunamadı" }, { status: 404 });
  }

  let amount: number;
  let customId: string;
  let description: string;

  if (type === "prepayment") {
    if (booking.customer_id !== user.id) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }
    if (booking.status !== "pending_payment") {
      return NextResponse.json({ error: "Rezervasyon ödeme beklemiyor" }, { status: 409 });
    }
    amount = Number(booking.prepayment_amount);
    customId = `${booking.id}:prepayment`;
    description = "PutzPilot Reinigung — 20% Anzahlung";
  } else {
    // reservation_fee: iş 'open' olmalı ve kilit bu temizlikçide olmalı
    if (booking.status !== "open") {
      return NextResponse.json({ error: "İş artık açık değil" }, { status: 409 });
    }
    const lockFresh =
      booking.claim_locked_at &&
      Date.now() - new Date(booking.claim_locked_at).getTime() < 10 * 60 * 1000;
    if (booking.claim_locked_by !== user.id || !lockFresh) {
      return NextResponse.json(
        { error: "Önce 'İşi Al' ile işi kilitleyin" },
        { status: 409 }
      );
    }
    amount = Number(booking.reservation_fee_amount);
    customId = `${booking.id}:reservation_fee:${user.id}`;
    description = "PutzPilot — İş rezervasyon ücreti (%10)";
  }

  const origin = request.nextUrl.origin;
  const order = await createOrder({
    amount,
    customId,
    description,
    returnUrl: `${origin}/payment/return?booking=${booking.id}&type=${type}`,
    cancelUrl: `${origin}/payment/cancelled?booking=${booking.id}`,
  });

  // payments kaydı (insert sadece service role'de)
  const { error: payErr } = await admin.from("payments").insert({
    booking_id: booking.id,
    payer: type === "prepayment" ? "customer" : "cleaner",
    type,
    provider: "paypal",
    paypal_order_id: order.id,
    amount,
    status: "created",
  });
  if (payErr) return NextResponse.json({ error: payErr.message }, { status: 500 });

  const approveUrl = order.links.find((l) => l.rel === "approve")?.href ?? null;
  return NextResponse.json({ order_id: order.id, approve_url: approveUrl });
}
