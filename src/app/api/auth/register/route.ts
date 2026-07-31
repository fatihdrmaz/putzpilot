import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Kayıt — rol ataması service role ile yapılır (profiles.role client'tan değiştirilemez).
export async function POST(request: NextRequest) {
  const { email, password, first_name, last_name, phone, role, language } =
    await request.json();

  if (!email || !password || password.length < 8) {
    return NextResponse.json(
      { error: "E-posta ve en az 8 karakterli şifre gerekli" },
      { status: 400 }
    );
  }
  const safeRole = role === "cleaner" ? "cleaner" : "customer";

  const admin = createAdminClient();
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { error: profErr } = await admin
    .from("profiles")
    .update({
      role: safeRole,
      first_name: first_name ?? null,
      last_name: last_name ?? null,
      phone: phone ?? null,
      language: language === "de" ? "de" : safeRole === "cleaner" ? "tr" : "de",
    })
    .eq("id", created.user.id);
  if (profErr) return NextResponse.json({ error: profErr.message }, { status: 500 });

  if (safeRole === "cleaner") {
    await admin.from("cleaner_profiles").insert({ user_id: created.user.id });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
