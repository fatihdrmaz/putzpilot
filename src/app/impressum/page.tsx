import type { Metadata } from "next";
import { LegalShell, LegalSection } from "@/components/legal-shell";

export const metadata: Metadata = { title: "Impressum — PutzPilot" };

// Impressum (Angaben gemäß § 5 DDG / § 5 TMG). Betreiberdaten sind Platzhalter.
export default function ImpressumPage() {
  return (
    <LegalShell title="Impressum">
      <LegalSection heading="Angaben gemäß § 5 DDG">
        <p>
          [Firmenname, z. B. PutzPilot OÜ]
          <br />
          [Straße und Hausnummer]
          <br />
          [PLZ, Ort, Land — z. B. Tallinn, Estland]
        </p>
      </LegalSection>

      <LegalSection heading="Vertreten durch">
        <p>[Name der vertretungsberechtigten Person]</p>
      </LegalSection>

      <LegalSection heading="Kontakt">
        <p>
          E-Mail: [kontakt@putzpilot.de]
          <br />
          Telefon / WhatsApp: [+49 …]
        </p>
      </LegalSection>

      <LegalSection heading="Registereintrag">
        <p>
          Registergericht / Register: [z. B. Handelsregister Estland]
          <br />
          Registernummer: [Nummer]
        </p>
      </LegalSection>

      <LegalSection heading="Umsatzsteuer-ID">
        <p>
          Umsatzsteuer-Identifikationsnummer gemäß § 27 a UStG: [USt-IdNr / KMKR nr]
        </p>
      </LegalSection>

      <LegalSection heading="Verantwortlich für den Inhalt">
        <p>[Name, Anschrift wie oben]</p>
      </LegalSection>

      <LegalSection heading="Hinweis zur Vermittlung">
        <p>
          PutzPilot ist ein Vermittlungsdienst. Die Reinigungsleistungen werden von
          selbstständigen, geprüften Reinigungskräften erbracht; PutzPilot ist nicht selbst
          Erbringer der Reinigungsdienstleistung.
        </p>
      </LegalSection>

      <LegalSection heading="EU-Streitschlichtung">
        <p>
          Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS)
          bereit: https://ec.europa.eu/consumers/odr. Wir sind nicht verpflichtet und nicht
          bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
          teilzunehmen.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
