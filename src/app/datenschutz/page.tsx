import type { Metadata } from "next";
import { LegalShell, LegalSection } from "@/components/legal-shell";

export const metadata: Metadata = { title: "Datenschutzerklärung — PutzPilot" };

// Datenschutzerklärung — Vorlage. Muss durch tatsächliche Betreiberangaben ergänzt
// und rechtlich geprüft werden.
export default function DatenschutzPage() {
  return (
    <LegalShell title="Datenschutzerklärung">
      <LegalSection heading="1. Verantwortlicher">
        <p>
          Verantwortlich für die Datenverarbeitung ist [Firmenname / Betreiber], [Anschrift],
          [E-Mail]. Siehe auch unser Impressum.
        </p>
      </LegalSection>

      <LegalSection heading="2. Welche Daten wir verarbeiten">
        <p>
          Zur Vermittlung von Reinigungsaufträgen verarbeiten wir: Kontaktdaten (Name, Telefon,
          E-Mail), Adress- und Objektdaten der Buchung, Terminangaben, optionale Fotos der
          Wohnung, Zahlungsstatus (über PayPal), Standortdaten der Reinigungskraft zur
          Start-/Endbestätigung (GPS) sowie bei Reinigungskräften Identitätsnachweise.
        </p>
      </LegalSection>

      <LegalSection heading="3. Zwecke und Rechtsgrundlage">
        <p>
          Die Verarbeitung erfolgt zur Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO), zur
          Erfüllung rechtlicher Pflichten (lit. c) sowie auf Grundlage berechtigter Interessen
          (lit. f), etwa zur Betrugs- und Sicherheitsprävention und Identitätsprüfung.
        </p>
      </LegalSection>

      <LegalSection heading="4. Empfänger / Auftragsverarbeiter">
        <p>
          Wir setzen sorgfältig ausgewählte Dienstleister ein: Supabase (Hosting der Datenbank,
          EU-Region), Vercel (Hosting der Anwendung), PayPal (Zahlungsabwicklung), WhatsApp
          Business / Meta (Benachrichtigungen) und DeepL (Übersetzung von Support-Nachrichten).
          Mit diesen bestehen, soweit erforderlich, Auftragsverarbeitungsverträge.
        </p>
      </LegalSection>

      <LegalSection heading="5. Adressgeheimnis">
        <p>
          Die vollständige Adresse eines Kunden wird einer Reinigungskraft erst nach
          verbindlicher, bezahlter Auftragsannahme offengelegt. Vorher sind nur Stadt, Bezirk und
          ungefähre Entfernung sichtbar.
        </p>
      </LegalSection>

      <LegalSection heading="6. Speicherdauer">
        <p>
          Wir speichern personenbezogene Daten nur so lange, wie es für die genannten Zwecke oder
          aufgrund gesetzlicher Aufbewahrungsfristen erforderlich ist. Identitätsdokumente werden
          in einem privaten, zugriffsbeschränkten Speicher gehalten.
        </p>
      </LegalSection>

      <LegalSection heading="7. Ihre Rechte">
        <p>
          Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der
          Verarbeitung, Datenübertragbarkeit und Widerspruch sowie das Recht auf Beschwerde bei
          einer Aufsichtsbehörde. Anfragen richten Sie an [E-Mail].
        </p>
      </LegalSection>
    </LegalShell>
  );
}
