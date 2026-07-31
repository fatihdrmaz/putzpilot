"use client";

// Müşteri rezervasyon sihirbazı — Almanca (mockup adım 2-9):
// Adresse → Wohnung → Reinigungsart → Prioritäten → Extras → Termin → Übersicht → Zahlung

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Button,
  Card,
  ChoiceChip,
  Field,
  Input,
  Select,
  StepDots,
  Toggle,
  Banner,
} from "@/components/ui";
import { IconChevronLeft, IconSparkle } from "@/components/icons";

const PRIORITIES = ["Küche", "Bad", "Fenster", "Bügeln", "Balkon / Terrasse"] as const;

const CLEANING_TYPES = [
  { key: "normal", label: "Normale Reinigung", sub: "Standard-Reinigung", extra: "" },
  { key: "tasinma", label: "Umzugsreinigung", sub: "Tiefenreinigung", extra: "+20%" },
  { key: "insaat", label: "Bauendreinigung", sub: "Nach Renovierung", extra: "+35%" },
] as const;

// Baz saat ücreti server'da price_rules'tan hesaplanır; burada sadece önizleme
const PREVIEW_HOUR_PRICE = 25;

export default function BookingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  // Form state
  const [postalCode, setPostalCode] = useState("");
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [apartment, setApartment] = useState("");
  const [sizeM2, setSizeM2] = useState("80");
  const [rooms, setRooms] = useState("2");
  const [bathrooms, setBathrooms] = useState("1");
  const [type, setType] = useState<(typeof CLEANING_TYPES)[number]["key"]>("normal");
  const [priorities, setPriorities] = useState<string[]>([]);
  const [hasPets, setHasPets] = useState(false);
  const [smoking, setSmoking] = useState(false);
  const [hasElevator, setHasElevator] = useState(false);
  const [someoneHome, setSomeoneHome] = useState(false);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [hours, setHours] = useState(4);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setLoggedIn(Boolean(data.user)));
  }, []);

  const surcharge = type === "tasinma" ? 20 : type === "insaat" ? 35 : 0;
  const preview = useMemo(() => {
    const base = PREVIEW_HOUR_PRICE * hours;
    const total = Math.round(base * (1 + surcharge / 100) * 100) / 100;
    return { total, prepay: Math.round(total * 20) / 100 };
  }, [hours, surcharge]);

  const steps = [
    "Adresse",
    "Wohnungsdetails",
    "Reinigungsart",
    "Prioritäten",
    "Zusatzinfos",
    "Termin",
    "Übersicht",
  ];

  function validateStep(): string | null {
    if (step === 0) {
      if (!/^\d{5}$/.test(postalCode)) return "Bitte gültige Postleitzahl eingeben (5 Ziffern).";
      if (!street.trim() || !houseNumber.trim()) return "Bitte Straße und Hausnummer eingeben.";
    }
    if (step === 5) {
      if (!date) return "Bitte Datum wählen.";
      if (new Date(`${date}T${startTime}`) < new Date()) return "Der Termin liegt in der Vergangenheit.";
    }
    return null;
  }

  function next() {
    const v = validateStep();
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }

  async function submit() {
    if (!loggedIn) {
      router.push(`/login?next=${encodeURIComponent("/buchen")}`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: {
            postal_code: postalCode,
            city: "Köln",
            street,
            house_number: houseNumber,
            apartment: apartment || null,
          },
          cleaning_type: type,
          size_m2: Number(sizeM2) || null,
          rooms: Number(rooms) || null,
          bathrooms: Number(bathrooms) || null,
          duration_hours: hours,
          priorities,
          has_pets: hasPets,
          smoking,
          has_elevator: hasElevator,
          someone_home: someoneHome,
          scheduled_date: date,
          start_time: startTime,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Buchung fehlgeschlagen");

      // PayPal order başlat
      const pay = await fetch("/api/payments/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: data.booking.id, type: "prepayment" }),
      });
      const payData = await pay.json();
      if (pay.status === 503) {
        setError(
          "Ihre Buchung wurde gespeichert. Die Online-Zahlung wird in Kürze aktiviert — wir melden uns bei Ihnen."
        );
        setLoading(false);
        return;
      }
      if (!pay.ok) throw new Error(payData.error ?? "Zahlung konnte nicht gestartet werden");
      window.location.href = payData.approve_url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ein Fehler ist aufgetreten");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-10">
      <header className="flex items-center justify-between py-4">
        <button
          type="button"
          aria-label="Zurück"
          onClick={() => (step === 0 ? router.push("/") : setStep(step - 1))}
          className="flex size-11 cursor-pointer items-center justify-center rounded-xl hover:bg-ink/5"
        >
          <IconChevronLeft size={22} className="text-ink" />
        </button>
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand">
            <IconSparkle size={16} className="text-ink" />
          </span>
          <span className="font-extrabold text-ink">PutzPilot</span>
        </div>
        <span className="w-11" />
      </header>

      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-ink">{steps[step]}</h1>
        <StepDots total={steps.length} current={step} />
      </div>

      {error && (
        <div className="mb-4">
          <Banner tone={error.startsWith("Ihre Buchung") ? "info" : "error"}>{error}</Banner>
        </div>
      )}

      <Card className="flex flex-col gap-5 p-5">
        {step === 0 && (
          <>
            <Field label="Postleitzahl" htmlFor="plz" helper="z. B. 50667">
              <Input id="plz" inputMode="numeric" maxLength={5} value={postalCode} onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ""))} />
            </Field>
            <div className="grid grid-cols-[1fr_100px] gap-3">
              <Field label="Straße" htmlFor="str">
                <Input id="str" autoComplete="address-line1" value={street} onChange={(e) => setStreet(e.target.value)} />
              </Field>
              <Field label="Nr." htmlFor="nr">
                <Input id="nr" value={houseNumber} onChange={(e) => setHouseNumber(e.target.value)} />
              </Field>
            </div>
            <Field label="Etage / Wohnung (optional)" htmlFor="apt" helper="z. B. 2. OG, Tür 3">
              <Input id="apt" value={apartment} onChange={(e) => setApartment(e.target.value)} />
            </Field>
            <p className="text-xs text-ink/50">
              Ihre vollständige Adresse wird erst nach verbindlicher Auftragsannahme an die
              Reinigungskraft weitergegeben.
            </p>
          </>
        )}

        {step === 1 && (
          <>
            <Field label="Wohnungsgröße (m²)" htmlFor="m2">
              <Input id="m2" inputMode="numeric" value={sizeM2} onChange={(e) => setSizeM2(e.target.value.replace(/\D/g, ""))} />
            </Field>
            <Field label="Zimmer" htmlFor="rooms">
              <Select id="rooms" value={rooms} onChange={(e) => setRooms(e.target.value)}>
                {["1", "2", "3", "4", "5", "6"].map((r) => (
                  <option key={r} value={r}>
                    {r} + Wohnzimmer
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Badezimmer" htmlFor="baths">
              <Select id="baths" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)}>
                {["1", "2", "3"].map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </Select>
            </Field>
          </>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-3">
            {CLEANING_TYPES.map((t) => (
              <button
                key={t.key}
                type="button"
                aria-pressed={type === t.key}
                onClick={() => setType(t.key)}
                className={`flex cursor-pointer items-center justify-between rounded-xl border-2 px-4 py-3.5 text-left transition-all duration-150 active:scale-[0.99] ${
                  type === t.key ? "border-brand bg-brand-soft" : "border-ink/10 bg-white hover:border-ink/25"
                }`}
              >
                <span>
                  <span className="block text-sm font-bold text-ink">{t.label}</span>
                  <span className="block text-xs text-ink/55">{t.sub}</span>
                </span>
                {t.extra && (
                  <span className="rounded-lg bg-brand px-2 py-1 text-xs font-extrabold text-ink">
                    {t.extra}
                  </span>
                )}
              </button>
            ))}
            <p className="text-xs text-ink/50">
              Der Preis wird automatisch nach der gewählten Art berechnet.
            </p>
          </div>
        )}

        {step === 3 && (
          <>
            <p className="text-sm text-ink/60">Mehrfachauswahl möglich — ohne Aufpreis.</p>
            <div className="flex flex-wrap gap-2">
              {PRIORITIES.map((pr) => (
                <ChoiceChip
                  key={pr}
                  selected={priorities.includes(pr)}
                  onClick={() =>
                    setPriorities((cur) =>
                      cur.includes(pr) ? cur.filter((x) => x !== pr) : [...cur, pr]
                    )
                  }
                >
                  {pr}
                </ChoiceChip>
              ))}
            </div>
          </>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-4">
            {(
              [
                ["Haustiere vorhanden?", hasPets, setHasPets],
                ["Wird geraucht?", smoking, setSmoking],
                ["Aufzug vorhanden?", hasElevator, setHasElevator],
                ["Ist jemand zu Hause?", someoneHome, setSomeoneHome],
              ] as [string, boolean, (v: boolean) => void][]
            ).map(([label, value, setter]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm font-semibold text-ink">{label}</span>
                <Toggle checked={value} onChange={setter} label={label} />
              </div>
            ))}
          </div>
        )}

        {step === 5 && (
          <>
            <Field label="Datum" htmlFor="date">
              <Input id="date" type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Startzeit" htmlFor="time">
              <Select id="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}>
                {["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Dauer">
              <div className="grid grid-cols-3 gap-2">
                {[3, 4, 5, 6, 7, 8].map((h) => (
                  <ChoiceChip key={h} selected={hours === h} onClick={() => setHours(h)}>
                    {h} Std.
                  </ChoiceChip>
                ))}
              </div>
            </Field>
          </>
        )}

        {step === 6 && (
          <div className="flex flex-col gap-3">
            {[
              [`${hours} Stunden Reinigung`, `${(PREVIEW_HOUR_PRICE * hours).toFixed(2)} €`],
              ...(surcharge ? [[`Zuschlag (+${surcharge}%)`, `${(preview.total - PREVIEW_HOUR_PRICE * hours).toFixed(2)} €`]] : []),
            ].map(([label, val]) => (
              <div key={label} className="flex items-center justify-between text-sm text-ink/70">
                <span>{label}</span>
                <span className="font-semibold tabular-nums">{val}</span>
              </div>
            ))}
            <hr className="border-ink/10" />
            <div className="flex items-center justify-between text-base font-extrabold text-ink">
              <span>Gesamtbetrag</span>
              <span className="tabular-nums">{preview.total.toFixed(2)} €</span>
            </div>
            <div className="flex items-center justify-between text-sm font-bold text-success">
              <span>Jetzt online (20%)</span>
              <span className="tabular-nums">{preview.prepay.toFixed(2)} €</span>
            </div>
            <div className="flex items-center justify-between text-sm text-ink/60">
              <span>Rest bar nach der Reinigung</span>
              <span className="tabular-nums">{(preview.total - preview.prepay).toFixed(2)} €</span>
            </div>
            <p className="mt-1 rounded-xl bg-brand-soft px-3 py-2 text-xs text-ink/70">
              {date} um {startTime} Uhr — {street} {houseNumber}, {postalCode} Köln.
              Endgültiger Preis wird serverseitig berechnet.
            </p>
            {loggedIn === false && (
              <p className="text-xs text-ink/60">
                Für die Buchung benötigen Sie ein Konto.{" "}
                <Link href={`/login?next=${encodeURIComponent("/buchen")}`} className="font-bold underline">
                  Jetzt anmelden
                </Link>
              </p>
            )}
          </div>
        )}
      </Card>

      <div className="mt-5">
        {step < steps.length - 1 ? (
          <Button className="w-full" onClick={next}>
            Weiter
          </Button>
        ) : (
          <Button className="w-full" loading={loading} onClick={submit}>
            {preview.prepay.toFixed(2)} € mit PayPal zahlen
          </Button>
        )}
      </div>
    </main>
  );
}
