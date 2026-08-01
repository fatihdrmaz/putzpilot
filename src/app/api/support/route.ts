import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { translate } from "@/lib/translate";

// Müşteri destek: mesaj gönderir (Almanca). DE->TR çevrilip admin kuyruğuna düşer.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const { text } = await request.json();
  if (!text?.trim()) return NextResponse.json({ error: "Mesaj boş" }, { status: 400 });

  const admin = createAdminClient();

  // Müşterinin açık thread'ini bul, yoksa oluştur
  let { data: thread } = await admin
    .from("support_threads")
    .select("id")
    .eq("customer_id", user.id)
    .maybeSingle();
  if (!thread) {
    const { data: profile } = await admin
      .from("profiles")
      .select("phone")
      .eq("id", user.id)
      .single();
    const { data: created, error } = await admin
      .from("support_threads")
      .insert({ customer_id: user.id, wa_phone: profile?.phone ?? "" })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    thread = created;
  }

  const tr = await translate(text, "TR"); // admin Türkçe okur
  const { error: msgErr } = await admin.from("support_messages").insert({
    thread_id: thread.id,
    direction: "in",
    original_text: text,
    translated_text: tr.text,
    language: "de",
    admin_approved: true, // gelen mesaj otomatik görünür
  });
  if (msgErr) return NextResponse.json({ error: msgErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// Müşteri kendi konuşmasını görür (Almanca gösterilir).
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const admin = createAdminClient();
  const { data: thread } = await admin
    .from("support_threads")
    .select("id")
    .eq("customer_id", user.id)
    .maybeSingle();
  if (!thread) return NextResponse.json({ messages: [] });

  const { data: messages } = await admin
    .from("support_messages")
    .select("direction, original_text, translated_text, created_at")
    .eq("thread_id", thread.id)
    .order("created_at", { ascending: true });

  // Müşteriye Almanca gösterilir: 'in' -> kendi yazdığı (original de),
  // 'out' -> admin yanıtının Almanca çevirisi (translated_text)
  return NextResponse.json({
    messages: (messages ?? []).map((m) => ({
      direction: m.direction,
      text: m.direction === "in" ? m.original_text : m.translated_text ?? m.original_text,
      created_at: m.created_at,
    })),
  });
}
