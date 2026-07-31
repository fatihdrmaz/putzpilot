// PRD Bölüm 2, 5, 11 — fiyatlama ve iptal/iade kuralları.
// Yüzde değerleri price_rules tablosundan gelir; buradakiler tip ve hesap mantığıdır.

export type CleaningType = "normal" | "tasinma" | "insaat";

export interface PriceRules {
  prepayment_pct: number; // müşteri ön ödemesi (varsayılan 20)
  fee_pct: number; // temizlikçi rezervasyon ücreti (varsayılan 10)
  moving_pct: number; // taşınma ek yüzdesi (varsayılan 20)
  construction_pct: number; // inşaat/tadilat ek yüzdesi (varsayılan 35)
  base_hour_price: number; // saatlik baz fiyat EUR (varsayılan 25)
}

export interface Quote {
  basePrice: number;
  surchargePct: number;
  totalPrice: number;
  prepaymentAmount: number; // müşteri online öder
  reservationFeeAmount: number; // temizlikçi öder
  cashRemainder: number; // temizlik sonunda nakit
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function calculateQuote(
  type: CleaningType,
  durationHours: number,
  rules: PriceRules
): Quote {
  if (durationHours < 3 || durationHours > 8) {
    throw new Error("Temizlik süresi 3-8 saat aralığında olmalıdır");
  }
  const surchargePct =
    type === "tasinma" ? rules.moving_pct : type === "insaat" ? rules.construction_pct : 0;

  const basePrice = round2(rules.base_hour_price * durationHours);
  const totalPrice = round2(basePrice * (1 + surchargePct / 100));
  const prepaymentAmount = round2(totalPrice * (rules.prepayment_pct / 100));
  const reservationFeeAmount = round2(totalPrice * (rules.fee_pct / 100));

  return {
    basePrice,
    surchargePct,
    totalPrice,
    prepaymentAmount,
    reservationFeeAmount,
    cashRemainder: round2(totalPrice - prepaymentAmount),
  };
}

// ---------- İptal / iade kuralları (PRD Bölüm 11) ----------

export type CancellationRule =
  | "customer_gt48h" // ön ödeme %100 iade
  | "customer_24_48h" // ön ödeme %50 iade
  | "customer_lt24h" // iade yok
  | "customer_no_show" // iade yok
  | "cleaner_gt24h" // rezervasyon ücreti %100 iade
  | "cleaner_lt24h" // iade yok + 1 ihtar
  | "cleaner_no_show" // iade yok + 2 ihtar
  | "platform"; // her şey %100 iade

export interface RefundDecision {
  rule: CancellationRule;
  customerRefundPct: number; // ön ödemenin yüzdesi
  cleanerRefundPct: number; // rezervasyon ücretinin yüzdesi
  penaltyPoints: number; // temizlikçiye yazılacak ihtar puanı
}

export function decideCustomerCancellation(hoursUntilStart: number): RefundDecision {
  if (hoursUntilStart > 48)
    return { rule: "customer_gt48h", customerRefundPct: 100, cleanerRefundPct: 100, penaltyPoints: 0 };
  if (hoursUntilStart >= 24)
    return { rule: "customer_24_48h", customerRefundPct: 50, cleanerRefundPct: 100, penaltyPoints: 0 };
  return { rule: "customer_lt24h", customerRefundPct: 0, cleanerRefundPct: 100, penaltyPoints: 0 };
}

export function decideCleanerCancellation(hoursUntilStart: number, noShow = false): RefundDecision {
  if (noShow)
    return { rule: "cleaner_no_show", customerRefundPct: 0, cleanerRefundPct: 0, penaltyPoints: 2 };
  if (hoursUntilStart > 24)
    return { rule: "cleaner_gt24h", customerRefundPct: 0, cleanerRefundPct: 100, penaltyPoints: 0 };
  return { rule: "cleaner_lt24h", customerRefundPct: 0, cleanerRefundPct: 0, penaltyPoints: 1 };
}

export const PLATFORM_CANCELLATION: RefundDecision = {
  rule: "platform",
  customerRefundPct: 100,
  cleanerRefundPct: 100,
  penaltyPoints: 0,
};

// 3 ihtar puanında hesap askıya alınır (PRD 11.2)
export const SUSPENSION_THRESHOLD = 3;

// GPS doğrulama eşiği — adrese en fazla bu mesafede 'Başla/Tamamla' kabul edilir
export const GPS_MAX_DISTANCE_M = 250;

export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}
