import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { translate } from "@/lib/translate";
import { sendWhatsAppTemplate } from "@/lib/notifications";

// Admin: bir thread'in tüm mesajları (orijinal + çeviri birlikte).
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/admin/support/[id]">) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { id } = await ctx.params;
  const admin = createAdminClient();
  const { data: thread } = await admin
    .from("support_threads")
    .select("id, customer_id, profiles(first_name, last_name, phone)")
    .eq("id", id)
    .single();
  const { data: messages } = await admin
    .from("support_messages")
    .select("id, direction, original_text, translated_text, language, created_at")
    .eq("thread_id", id)
    .order("created_at", { ascending: true });

  const profile = thread?.profiles as unknown as {
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  };
  return NextResponse.json({
    customer_name: [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Müşteri",
    phone: profile?.phone ?? null,
    messages: messages ?? [],
  });
}

// Admin yanıtı (Türkçe yazar) -> TR->DE çevrilir -> müşteriye gider.
export async function POST(request: NextRequest, ctx: RouteContext<"/api/admin/support/[id]">) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { id } = await ctx.params;
  const { text } = await request.json();
  if (!text?.trim()) return NextResponse.json({ error: "Mesaj boş" }, { status: 400 });

  const admin = createAdminClient();
  const { data: thread } = await admin
    .from("support_threads")
    .select("id, wa_phone")
    .eq("id", id)
    .single();
  if (!thread) return NextResponse.json({ error: "Thread bulunamadı" }, { status: 404 });

  const de = await translate(text, "DE"); // müşteri Almanca okur

  const { error } = await admin.from("support_messages").insert({
    thread_id: id,
    direction: "out",
    original_text: text, // admin'in Türkçe yazdığı
    translated_text: de.text, // müşteriye giden Almanca
    language: "tr",
    admin_approved: true,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // WhatsApp yapılandırılmışsa çevrilmiş mesajı gönder (aksi halde web thread'de görünür)
  if (thread.wa_phone) {
    await sendWhatsAppTemplate({
      toPhone: thread.wa_phone,
      template: "cleaner_assigned", // serbest metin için ayrı şablon eklenene dek yer tutucu
      language: "de",
      bodyParams: [de.text],
    }).catch(() => null);
  }

  return NextResponse.json({ ok: true, sent_text: de.text });
}
