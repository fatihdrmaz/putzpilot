import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_KEYS = [
  "prepayment_pct",
  "fee_pct",
  "moving_pct",
  "construction_pct",
  "base_hour_price",
];

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const admin = createAdminClient();
  const { data, error } = await admin.from("price_rules").select("key, value, updated_at").order("key");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rules: data });
}

// Fiyat kuralları güncelleme (PRD Bölüm 9: %20/%35 yönetilebilir)
export async function PUT(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const body = await request.json();
  const updates = Object.entries(body).filter(
    ([k, v]) => ALLOWED_KEYS.includes(k) && Number.isFinite(Number(v)) && Number(v) >= 0
  );
  if (!updates.length) return NextResponse.json({ error: "Geçerli kural yok" }, { status: 400 });

  const admin = createAdminClient();
  for (const [key, value] of updates) {
    const { error } = await admin
      .from("price_rules")
      .update({ value: Number(value), updated_by: guard.userId, updated_at: new Date().toISOString() })
      .eq("key", key);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
