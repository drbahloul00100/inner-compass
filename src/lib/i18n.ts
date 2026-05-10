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
    about: string;
    privacy: string;
    terms: string;
  };
  home: {
    hero_heading: string;
    hero_body: string;
    cta_primary: string;
    cta_secondary: string;
    measures_title: string;
    measures_p1: string;
    measures_p2: string;
    measures_p3: string;
    expect_title: string;
    expect_time_label: string;
    expect_time_body: string;
    expect_style_label: string;
    expect_style_body: string;
    expect_output_label: string;
    expect_output_body: string;
    expect_privacy_label: string;
    expect_privacy_body: string;
  };
  about: {
    title: string;
    p1: string;
    p2: string;
    how_title: string;
    how_p1: string;
    how_p2: string;
    not_title: string;
    not_p1: string;
    privacy_title: string;
    privacy_p1: string;
    cta: string;
  };
  start: {
    title: string;
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
