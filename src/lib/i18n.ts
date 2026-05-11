export type Language = "en" | "ar";

// A question-bank field that is either a plain English string or a bilingual object.
// Components resolve to the active language via getLocalizedText().
export type LocalizedString = string | { en: string; ar: string };

export const LANG_STORAGE_KEY = "inner_compass_lang";

export function isValidLanguage(lang: unknown): lang is Language {
  return lang === "en" || lang === "ar";
}

export function getLocalizedText(value: LocalizedString, lang: Language): string {
  if (typeof value === "string") return value;
  return value[lang] ?? value.en;
}

// ---------------------------------------------------------------------------
// Translations interface — both en.ts and ar.ts must satisfy this shape.
// ---------------------------------------------------------------------------

export interface Translations {
  nav: {
    logo: string;
    about: string;
    begin: string;
  };
  footer: {
    copyright: (year: number) => string;
    tagline: string;
    about: string;
    privacy: string;
    terms: string;
  };
  home: {
    hero_heading: string;
    hero_body: string;
    cta_primary: string;
    cta_secondary: string;
    why_title: string;
    why_p1: string;
    why_p2: string;
    // Stats strip (animated counters)
    stats_items_label: string;
    stats_signatures_label: string;
    stats_drivers_label: string;
    stats_domains_label: string;
    stats_modes_label: string;
    // 6 reveal cards
    reveals_title: string;
    reveal1_title: string;  reveal1_body: string;
    reveal2_title: string;  reveal2_body: string;
    reveal3_title: string;  reveal3_body: string;
    reveal4_title: string;  reveal4_body: string;
    reveal5_title: string;  reveal5_body: string;
    reveal6_title: string;  reveal6_body: string;
    // 4-step flow
    how_title: string;
    flow1_title: string;  flow1_body: string;
    flow2_title: string;  flow2_body: string;
    flow3_title: string;  flow3_body: string;
    flow4_title: string;  flow4_body: string;
    // Report Preview (mock)
    preview_title: string;
    preview_subtitle: string;
    preview_label: string;
    preview_exec_label: string;
    preview_exec_body: string;
    preview_glance_label: string;
    preview_glance_signature_label: string;
    preview_glance_signature: string;
    preview_glance_driver_label: string;
    preview_glance_driver: string;
    preview_glance_recovery_label: string;
    preview_glance_recovery: string;
    preview_signature_label: string;
    preview_signature_body: string;
    preview_bar1_label: string;
    preview_bar2_label: string;
    preview_bar3_label: string;
    preview_devplan_label: string;
    preview_devplan_body: string;
    // Early reader reactions (placeholder)
    early_title: string;
    early_subtitle: string;
    early_placeholder_label: string;
    early_placeholder_quote: string;
    // Final CTA
    final_cta_title: string;
    final_cta_body: string;
  };
  about: {
    title: string;
    p1: string;
    p2: string;
    how_title: string;
    how_p1: string;
    how_p2: string;
    who_title: string;
    who_p1: string;
    not_title: string;
    not_p1: string;
    privacy_title: string;
    privacy_p1: string;
    cta: string;
  };
  start: {
    eyebrow: string;
    title: string;
    pill_minutes: string;
    pill_questions: string;
    pill_saved: string;
    p1: string;
    p2: string;
    p3: string;
    disclaimer: string;
    cta: string;
  };
  finalize: {
    title: string;
    subtitle: string;
    email_label: string;
    email_placeholder: string;
    submit: string;
    no_session: string;
    done_title: string;
    done_p1: string;
    done_p2: string;
  };
  assessment: {
    loading: string;
    error: string;
    prev: string;
    next: string;
    finish: string;
    validation_choose: string;
    validation_part_single: (part: number) => string;
    validation_parts_multiple: (parts: number[]) => string;
    validation_incomplete: (count: number) => string;
  };
  progress: {
    label: (current: number, total: number) => string;
  };
  two_part: {
    part_label: (index: number, total: number) => string;
  };
  free_text: {
    placeholder: string;
    help: string;
    char_count: (count: number, max: number) => string;
  };
}
