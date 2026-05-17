// Display-time translations for engine output values (signatures, drivers,
// patterns, bands, validity). Shared by /report/[id] and /report/[id]/print.
//
// These are translations of engine-OUTPUT VALUES, not UI chrome. The product
// team curates them here; they map 1:1 to the constants in
// src/lib/scoring/engine.ts.

import type { Language } from "@/lib/i18n";

export const SIGNATURE_AR: Record<string, string> = {
  fixer: "المُصلح",
  controller: "المتحكم",
  vanisher: "المتغيب",
  polisher: "المُلمِّع",
  escalator: "المُصعِّد",
  over_explainer: "المُبرِّر",
  shutter: "المُغلِق",
  accommodator: "المُهادِن",
  critic: "الناقد",
  sealed: "المكتوم",
  doubler: "المُضاعِف",
};

export const DRIVER_AR: Record<string, string> = {
  hunger_to_matter: "الحاجة للأهمية",
  hunger_to_be_seen: "الحاجة للظهور",
  hunger_for_control: "الحاجة للسيطرة",
  hunger_to_be_right: "الحاجة للصواب",
  hunger_for_safety: "الحاجة للأمان",
  hunger_to_be_loved: "الحاجة للمحبة",
  hunger_for_freedom: "الحاجة للحرية",
  hunger_to_belong: "الحاجة للانتماء",
  hunger_to_be_free_of_failure: "الحاجة لتجنب الفشل",
};

export const PATTERN_AR: Record<string, string> = {
  the_performance_loop: "دائرة الأداء",
  the_fortress: "القلعة",
  the_loaded_carrier: "الحامل المثقل",
  the_bargained_self: "الذات المُساوَمة",
  the_strategic_withdrawal: "الانسحاب الاستراتيجي",
  the_mission_bottleneck: "عنق الزجاجة",
  the_audit: "التدقيق",
};

export const BAND_AR: Record<string, string> = {
  // signature_activation / driver_intensity
  dominant: "مهيمن",
  strong: "قوي",
  present: "حاضر",
  quiet: "هادئ",
  // driver_regulation
  mastered: "متحكم فيه",
  steady: "مستقر",
  working: "قيد العمل",
  strained: "متوتر",
  // recovery_cost
  very_high: "مرتفع جداً",
  high: "مرتفع",
  medium: "متوسط",
  low: "منخفض",
  very_low: "منخفض جداً",
  // pattern_match
  very_strong: "قوي جداً",
  moderate: "معتدل",
  weak: "ضعيف",
};

export const VALIDITY_AR: Record<string, string> = {
  high: "عالية",
  good: "جيدة",
  moderate: "متوسطة",
  low: "منخفضة",
};

export function prettify(snake: string): string {
  if (!snake) return "";
  const spaced = String(snake).replace(/_/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function localize(
  value: string | null | undefined,
  map: Record<string, string>,
  lang: Language,
  fallback: string
): string {
  if (value === null || value === undefined || value === "") return fallback;
  const trimmed = String(value).trim();
  const lower = trimmed.toLowerCase();

  if (lang === "ar") {
    const hit = map[trimmed] ?? map[lower];
    if (hit) return hit;
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn("[reportLabels] no AR translation for:", JSON.stringify(value));
    }
    return prettify(trimmed);
  }
  return prettify(trimmed);
}

export function localizeBand(band: string | undefined, lang: Language): string {
  if (!band) return "";
  if (lang === "ar") return BAND_AR[band] ?? prettify(band);
  return prettify(band);
}
