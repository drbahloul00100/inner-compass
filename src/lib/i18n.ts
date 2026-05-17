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
    dashboard: string;
    sign_out: string;
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
    submitting: string;
    no_session: string;
    sent_title: string;
    sent_body: (email: string) => string;
    sent_resend: string;
    sent_back: string;
    error_generic: string;
    done_title: string;
    done_p1: string;
    done_p2: string;
  };
  login: {
    title: string;
    subtitle: string;
    email_label: string;
    email_placeholder: string;
    submit: string;
    submitting: string;
    sent_title: string;
    sent_body: (email: string) => string;
    error_generic: string;
  };
  dashboard: {
    title: string;
    signed_in_as: string;
    sign_out: string;
    loading: string;
    no_sessions_title: string;
    no_sessions_body: string;
    start_new: string;
    session_started_label: string;
    session_status_label: string;
    session_responses_label: string;
    session_language_label: string;
    status_started: string;
    status_in_progress: string;
    status_completed: string;
  };
  preparing: {
    title: string;
    subtitle: string;
    error_title: string;
    error_body: string;
    error_retry: string;
    error_skip: string;
    error_no_session: string;
  };
  report: {
    title: string;
    subtitle: string;
    primary_signature_label: string;
    primary_driver_label: string;
    primary_pattern_label: string;
    validity_label: string;
    signatures_section_title: string;
    drivers_section_title: string;
    patterns_section_title: string;
    intensity_label: string;
    regulation_label: string;
    match_label: string;
    placeholder_note: string;
    loading: string;
    not_found: string;
    back_to_dashboard: string;
    none: string;
    // Phase 4: full-report generation UI
    generate_section_title: string;
    generate_intro: string;
    generate_button: string;
    generating: string;
    generate_error: string;
    report_section_title: string;
    report_meta: (words: number) => string;
    copy_button: string;
    copied: string;
    regenerate_button: string;
  };
  callback: {
    auth_error_title: string;
    sync_error_title: string;
    sync_error_body: string;
    sync_retry: string;
    skip_to_dashboard: string;
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
