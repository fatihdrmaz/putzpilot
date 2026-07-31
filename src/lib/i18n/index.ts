// Hafif i18n — temizlikçi paneli TR/DE dil değişimli, müşteri arayüzü DE.
// Dil tercihi profiles.language kolonunda ve 'lang' cookie'sinde tutulur.

import { tr } from "./tr";
import { de } from "./de";

export type Locale = "tr" | "de";
export type Dictionary = typeof tr;

const dictionaries: Record<Locale, Dictionary> = { tr, de };

export function getDictionary(locale: string | undefined): Dictionary {
  return dictionaries[(locale === "de" ? "de" : "tr") as Locale];
}

export const SUPPORTED_LOCALES: Locale[] = ["tr", "de"];
