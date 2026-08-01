import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";

// Admin: destek thread listesi + son mesaj + yanıtsız sayısı.
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const admin = createAdminClient();
  const { data: threads } = await admin
    .from("support_threads")
    .select("id, customer_id, created_at, profiles(first_name, last_name, phone)")
    .order("created_at", { ascending: false });

  const withMeta = await Promise.all(
    (threads ?? []).map(async (t) => {
      const { data: msgs } = await admin
        .from("support_messages")
        .select("direction, translated_text, original_text, created_at")
        .eq("thread_id", t.id)
        .order("created_at", { ascending: false })
        .limit(20);
      const last = msgs?.[0];
      const lastInboundAt = msgs?.find((m) => m.direction === "in")?.created_at ?? null;
      const lastOutboundAt = msgs?.find((m) => m.direction === "out")?.created_at ?? null;
      const needsReply = lastInboundAt && (!lastOutboundAt || lastOutboundAt < lastInboundAt);
      const profile = t.profiles as unknown as {
        first_name: string | null;
        last_name: string | null;
        phone: string | null;
      };
      return {
        id: t.id,
        customer_name: [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Müşteri",
        phone: profile?.phone ?? null,
        last_preview: last ? (last.direction === "in" ? last.translated_text : last.original_text) : "",
        needs_reply: Boolean(needsReply),
        updated_at: last?.created_at ?? t.created_at,
      };
    })
  );

  withMeta.sort((a, b) => Number(b.needs_reply) - Number(a.needs_reply));
  return NextResponse.json({ threads: withMeta });
}
