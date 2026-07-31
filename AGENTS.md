<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# PutzPilot

Ev temizliği marketplace'i (Köln/Almanya pazarı). Müşteriler temizlik rezervasyonu yapar,
bağımsız temizlikçiler işleri alır. Kaynak doküman: PRD v4 (PutzPilot_PRD_v4.docx).

## İş modeli (özet)
- Müşteri toplam tutarın %20'sini PayPal ile ön öder, kalan %80 temizlik sonunda nakit.
- Temizlikçi işi almak için toplam tutarın %10'unu PayPal ile öder; webhook sonrası otomatik atama.
- Cüzdan/bakiye YOK — temizlikçi tarafında sadece "Kazançlarım" (bilgilendirme) ekranı var.
- Adres gizliliği: ödeme öncesi yalnızca şehir/ilçe/posta kodu ilk 3 hane + ~mesafe
  (`open_jobs` view). Tam adres RLS ile korunur, sadece atanmış temizlikçi görür.

## Stack
- Next.js (App Router, TypeScript, Tailwind) — Vercel
- Supabase: Postgres + RLS, Auth, Storage (private `documents` bucket)
- PayPal Orders API v2 + Webhooks (ödeme), Refunds API (iade)
- WhatsApp Business Cloud API (bildirimler), DeepL (TR<->DE destek çevirisi), Vercel Cron

## Yapı
- `supabase/migrations/` — şema + RLS. Şema değişikliği = yeni migration dosyası.
- `src/lib/supabase/` — client (browser), server (SSR), admin (service role; sadece sunucu).
- `src/lib/pricing.ts` — fiyat hesabı, iptal/iade kuralları (PRD Bölüm 11), GPS eşiği.

## Kurallar
- Booking durum geçişleri (open->assigned, start, complete, cancel) yalnızca service role
  ile API route'larında yapılır; client'a update policy verilmez.
- Webhook uçlarında PayPal imza doğrulaması ve idempotency zorunlu.
- Diller: müşteri arayüzü Almanca; temizlikçi paneli TR/DE dil değişimli (kullanıcı seçer);
  admin Türkçe. Para birimi EUR, TZ Europe/Berlin.
- Kişisel veri loglanmaz; kimlik belgeleri sadece private bucket'ta.
