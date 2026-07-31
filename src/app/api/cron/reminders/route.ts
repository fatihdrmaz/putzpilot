import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppTemplate } from "@/lib/notifications";

// Vercel Cron.
// NOT (Hobby planı): cron günde 1 kez çalışır (vercel.json: "0 5 * * *").
// 2. iş (süresi geçmiş açık işleri kapatma) günlükle uyumlu. Ancak 1. iş
// (sürenin ~%75'inde kontrol mesajı) sub-saat hassasiyet ister; günlük cronla
// pratikte tetiklenmez. Pro plana geçince schedule'ı "*/10 * * * *" yap veya
// checkpoint'i ayrı bir tetikleyiciyle (ör. Supabase Edge Function timer) çöz.
// 1) Devam eden işlerde sürenin ~%75'i geçtiyse müşteriye kontrol mesajı
// 2) Başlangıç saatine kadar atanamamış işlerde otomatik %100 iade (Bölüm 11.4 → cancel API'si platform kuralıyla)
export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const admin = createAdminClient();
  const results = { checkpoint_sent: 0, expired_open: 0 };

  // --- %75 kontrol mesajı ---
  const { data: inProgress } = await admin
    .from("bookings")
    .select("id, customer_id, duration_hours")
    .eq("status", "in_progress");

  for (const b of inProgress ?? []) {
    const { data: startEvent } = await admin
      .from("job_events")
      .select("created_at")
      .eq("booking_id", b.id)
      .eq("type", "started")
      .order("created_at", { ascending: true })
      .limit(1)
      .single();
    if (!startEvent) continue;

    const elapsedMs = Date.now() - new Date(startEvent.created_at).getTime();
    const checkpointMs = b.duration_hours * 3_600_000 * 0.75;
    if (elapsedMs < checkpointMs) continue;

    // İdempotency: bu iş için checkpoint mesajı zaten gönderildiyse atla
    const { data: sent } = await admin
      .from("job_events")
      .select("id")
      .eq("booking_id", b.id)
      .eq("type", "checkpoint_75")
      .maybeSingle();
    if (sent) continue;

    const { data: customer } = await admin
      .from("profiles")
      .select("phone, language")
      .eq("id", b.customer_id)
      .single();
    if (customer?.phone) {
      await sendWhatsAppTemplate({
        toPhone: customer.phone,
        template: "checkpoint_75",
        language: customer.language === "tr" ? "tr" : "de",
      });
    }
    await admin.from("job_events").insert({ booking_id: b.id, type: "checkpoint_75" });
    results.checkpoint_sent++;
  }

  // --- Başlangıcı geçmiş, hâlâ open işler: kapat (iade akışı ayrıca yönetilir) ---
  const nowBerlin = new Date().toISOString();
  const { data: expired } = await admin
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("status", "open")
    .lt("scheduled_date", nowBerlin.slice(0, 10))
    .select("id");
  results.expired_open = expired?.length ?? 0;

  return NextResponse.json(results);
}
