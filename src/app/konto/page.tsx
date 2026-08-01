"use client";

// Müşteri hesap/profil sayfası (Almanca) — ad, telefon, dil düzenleme.
// Profil güncelleme RLS ile korunur (kullanıcı yalnızca kendi profilini günceller).
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Banner, Button, Card, Field, Input, Select } from "@/components/ui";
import { IconChevronLeft, IconLogout, IconSparkle, IconUser } from "@/components/icons";

export default function KontoPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [language, setLanguage] = useState("de");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.push("/login?next=/konto");
        return;
      }
      setEmail(data.user.email ?? "");
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, phone, language")
        .eq("id", data.user.id)
        .single();
      if (profile) {
        setFirstName(profile.first_name ?? "");
        setLastName(profile.last_name ?? "");
        setPhone(profile.phone ?? "");
        setLanguage(profile.language ?? "de");
      }
      setLoading(false);
    });
  }, [router]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: firstName || null,
        last_name: lastName || null,
        phone: phone || null,
        language,
      })
      .eq("id", userData.user.id);
    setSaving(false);
    if (error) setError(error.message);
    else setNotice("Ihre Angaben wurden gespeichert.");
  }

  async function logout() {
    await createClient().auth.signOut();
    router.push("/");
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-10">
      <header className="flex items-center justify-between py-4">
        <Link href="/" aria-label="Startseite" className="flex size-11 items-center justify-center rounded-xl hover:bg-ink/5">
          <IconChevronLeft size={22} className="text-ink" />
        </Link>
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand">
            <IconSparkle size={16} className="text-ink" />
          </span>
          <span className="font-extrabold text-ink">Mein Konto</span>
        </div>
        <span className="w-11" />
      </header>

      {loading ? (
        <div className="h-72 animate-pulse rounded-2xl bg-ink/5" />
      ) : (
        <>
          <Card className="mb-4 flex items-center gap-4 p-5">
            <span className="flex size-14 items-center justify-center rounded-full bg-brand-soft">
              <IconUser size={26} className="text-brand-dark" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-bold text-ink">
                {[firstName, lastName].filter(Boolean).join(" ") || "Kunde"}
              </p>
              <p className="truncate text-xs text-ink/55">{email}</p>
            </div>
          </Card>

          <Card className="p-5">
            <form onSubmit={save} className="flex flex-col gap-4">
              {error && <Banner tone="error">{error}</Banner>}
              {notice && <Banner tone="success">{notice}</Banner>}

              <div className="grid grid-cols-2 gap-3">
                <Field label="Vorname" htmlFor="fn">
                  <Input id="fn" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </Field>
                <Field label="Nachname" htmlFor="ln">
                  <Input id="ln" autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </Field>
              </div>
              <Field label="Telefon" htmlFor="phone" helper="Für Benachrichtigungen per WhatsApp">
                <Input id="phone" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </Field>
              <Field label="Sprache der Benachrichtigungen" htmlFor="lang">
                <Select id="lang" value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <option value="de">Deutsch</option>
                  <option value="tr">Türkçe</option>
                </Select>
              </Field>
              <Button type="submit" loading={saving} className="mt-1 w-full">
                Speichern
              </Button>
            </form>
          </Card>

          <div className="mt-4 flex flex-col gap-2">
            <Link
              href="/buchungen"
              className="flex min-h-12 items-center justify-center rounded-xl border border-ink/10 bg-white text-sm font-bold text-ink transition-colors hover:border-brand"
            >
              Meine Buchungen
            </Link>
            <button
              type="button"
              onClick={logout}
              className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-danger/40 text-sm font-bold text-danger transition-colors hover:bg-danger/10"
            >
              <IconLogout size={18} /> Abmelden
            </button>
          </div>
        </>
      )}
    </main>
  );
}
