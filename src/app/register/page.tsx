"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Field, Input, Banner, ChoiceChip } from "@/components/ui";
import { IconSparkle } from "@/components/icons";

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/";
  const defaultRole = params.get("rolle") === "cleaner" ? "cleaner" : "customer";

  const [role, setRole] = useState<"customer" | "cleaner">(defaultRole);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        phone,
        role,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Registrierung fehlgeschlagen / Kayıt başarısız");
      setLoading(false);
      return;
    }
    const supabase = createClient();
    await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    router.push(role === "cleaner" ? "/panel" : next);
    router.refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-10">
      <div className="mb-8 flex items-center gap-2">
        <span className="flex size-10 items-center justify-center rounded-xl bg-brand">
          <IconSparkle size={22} className="text-ink" />
        </span>
        <span className="text-xl font-extrabold text-ink">PutzPilot</span>
      </div>

      <Card className="p-6">
        <h1 className="text-2xl font-extrabold text-ink">Registrieren / Kayıt Ol</h1>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <ChoiceChip selected={role === "customer"} onClick={() => setRole("customer")}>
            Kunde / Müşteri
          </ChoiceChip>
          <ChoiceChip selected={role === "cleaner"} onClick={() => setRole("cleaner")}>
            Reinigungskraft / Temizlikçi
          </ChoiceChip>
        </div>

        <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
          {error && <Banner tone="error">{error}</Banner>}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Vorname / Ad" htmlFor="fn">
              <Input id="fn" autoComplete="given-name" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </Field>
            <Field label="Nachname / Soyad" htmlFor="ln">
              <Input id="ln" autoComplete="family-name" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </Field>
          </div>
          <Field label="Telefon" htmlFor="phone" helper="+49 170 1234567">
            <Input id="phone" type="tel" autoComplete="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label="E-Mail" htmlFor="email">
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Passwort / Şifre" htmlFor="pw" helper="Min. 8 Zeichen / karakter">
            <Input id="pw" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Button type="submit" loading={loading} className="mt-2 w-full">
            Konto erstellen / Hesap Oluştur
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-ink/60">
          Bereits registriert?{" "}
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-bold text-ink underline">
            Anmelden
          </Link>
        </p>
      </Card>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
