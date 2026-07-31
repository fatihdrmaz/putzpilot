"use client";

// PayPal onayı sonrası dönüş: order'ı capture eder (webhook yedek olarak çalışır).
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Banner, Card } from "@/components/ui";
import { IconCheckCircle } from "@/components/icons";

function PaymentReturn() {
  const params = useSearchParams();
  const orderId = params.get("token"); // PayPal return_url'e ?token=<orderId> ekler
  const type = params.get("type");
  const [state, setState] = useState<"working" | "ok" | "error">("working");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!orderId) {
      setState("error");
      setMessage("Zahlungsreferenz fehlt.");
      return;
    }
    fetch("/api/payments/paypal/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: orderId }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        setState("ok");
      })
      .catch((e) => {
        setState("error");
        setMessage(e instanceof Error ? e.message : "Fehler bei der Zahlung");
      });
  }, [orderId]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-10">
      <Card className="flex flex-col items-center gap-4 p-8 text-center">
        {state === "working" && (
          <>
            <span className="size-10 animate-spin rounded-full border-4 border-brand border-t-transparent" aria-hidden />
            <p className="font-semibold text-ink">Zahlung wird bestätigt…</p>
          </>
        )}
        {state === "ok" && (
          <>
            <span className="flex size-16 items-center justify-center rounded-full bg-success/10">
              <IconCheckCircle size={36} className="text-success" />
            </span>
            <h1 className="text-xl font-extrabold text-ink">
              {type === "reservation_fee"
                ? "İş size atandı!"
                : "Ihre Buchung wurde erfolgreich erstellt."}
            </h1>
            <p className="text-sm text-ink/60">
              {type === "reservation_fee"
                ? "Tam adres bilgileri artık 'Aktif İşlerim' ekranında."
                : "Wir benachrichtigen Sie, sobald eine Reinigungskraft den Auftrag annimmt."}
            </p>
            <Link
              href={type === "reservation_fee" ? "/panel/aktif" : "/"}
              className="mt-2 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-ink hover:bg-brand-dark"
            >
              {type === "reservation_fee" ? "Aktif İşlerim" : "Zur Startseite"}
            </Link>
          </>
        )}
        {state === "error" && <Banner tone="error">{message}</Banner>}
      </Card>
    </main>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense>
      <PaymentReturn />
    </Suspense>
  );
}
