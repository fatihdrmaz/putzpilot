"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Field, Input, Banner } from "@/components/ui";
import { IconSparkle } from "@/components/icons";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("Anmeldung fehlgeschlagen. / Giriş başarısız.");
      return;
    }
    router.push(next);
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
        <h1 className="text-2xl font-extrabold text-ink">Anmelden / Giriş Yap</h1>
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          {error && <Banner tone="error">{error}</Banner>}
          <Field label="E-Mail" htmlFor="email">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Passwort / Şifre" htmlFor="password">
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Button type="submit" loading={loading} className="mt-2 w-full">
            Anmelden
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-ink/60">
          Noch kein Konto?{" "}
          <Link href={`/register?next=${encodeURIComponent(next)}`} className="font-bold text-ink underline">
            Registrieren
          </Link>
        </p>
      </Card>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
