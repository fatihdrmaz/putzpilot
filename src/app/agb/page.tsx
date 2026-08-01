import type { Metadata } from "next";
import { LegalShell, LegalSection } from "@/components/legal-shell";

export const metadata: Metadata = { title: "AGB — PutzPilot" };

// Allgemeine Geschäftsbedingungen — Vorlage. Rechtlich prüfen lassen.
export default function AGBPage() {
  return (
    <LegalShell title="Allgemeine Geschäftsbedingungen">
      <LegalSection heading="1. Geltungsbereich und Rolle der Plattform">
        <p>
          PutzPilot betreibt eine Online-Plattform, die Kunden und selbstständige
          Reinigungskräfte zusammenbringt. PutzPilot erbringt selbst keine Reinigungsleistung,
          sondern vermittelt lediglich den Auftrag. Der Reinigungsvertrag kommt zwischen Kunde
          und Reinigungskraft zustande.
        </p>
      </LegalSection>

      <LegalSection heading="2. Buchung und Preise">
        <p>
          Der Preis richtet sich nach Dauer und Reinigungsart. Bei der Buchung zahlt der Kunde
          20 % des Gesamtbetrags online als Anzahlung; die restlichen 80 % werden nach der
          Reinigung bar direkt an die Reinigungskraft gezahlt.
        </p>
      </LegalSection>

      <LegalSection heading="3. Reservierungsgebühr der Reinigungskraft">
        <p>
          Um einen Auftrag verbindlich anzunehmen, zahlt die Reinigungskraft eine
          Reservierungsgebühr in Höhe von 10 % des Auftragswerts an die Plattform. Nach
          erfolgreicher Zahlung wird der Auftrag automatisch zugewiesen.
        </p>
      </LegalSection>

      <LegalSection heading="4. Stornierung und Terminverschiebung">
        <p>
          Es gelten die folgenden Fristen: Bei Stornierung durch den Kunden mehr als 48 Stunden
          vor Beginn wird die Anzahlung vollständig erstattet, zwischen 24 und 48 Stunden zu
          50 %, weniger als 24 Stunden erfolgt keine Erstattung. Eine kostenlose
          Terminverschiebung ist einmalig bis 24 Stunden vor Beginn möglich. Stornierungen durch
          die Reinigungskraft führen zur erneuten Ausschreibung des Auftrags; kann kein Ersatz
          gefunden werden, wird die Anzahlung vollständig erstattet.
        </p>
      </LegalSection>

      <LegalSection heading="5. Identitätsprüfung">
        <p>
          Reinigungskräfte werden vor Freischaltung anhand von Identitätsnachweisen geprüft.
          PutzPilot behält sich vor, Konten bei Verstößen zu sperren.
        </p>
      </LegalSection>

      <LegalSection heading="6. Haftung">
        <p>
          Als Vermittler haftet PutzPilot nicht für die Durchführung oder Qualität der
          Reinigungsleistung. Ansprüche aus der Leistungserbringung bestehen zwischen Kunde und
          Reinigungskraft. [Weitere Haftungsregelungen bitte rechtlich prüfen lassen.]
        </p>
      </LegalSection>

      <LegalSection heading="7. Schlussbestimmungen">
        <p>
          Es gilt [anwendbares Recht]. Sollte eine Bestimmung unwirksam sein, bleibt die
          Wirksamkeit der übrigen Bestimmungen unberührt.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
