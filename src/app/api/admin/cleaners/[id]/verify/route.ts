import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";

// Temizlikçi onayı/reddi (PRD Bölüm 6: admin onayı sonrası hesap aktifleşir).
export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/cleaners/[id]/verify">
) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { id } = await ctx.params;
  const { action } = await request.json();
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action approve|reject olmalı" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("cleaner_profiles")
    .update({
      verification_status: action === "approve" ? "approved" : "rejected",
      approved_at: action === "approve" ? new Date().toISOString() : null,
    })
    .eq("user_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
