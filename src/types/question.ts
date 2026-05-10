// Frontend-safe question types.
// These types intentionally OMIT score_mapping, scoring_metadata, and internal_notes.
// Those fields exist in the source JSON but are stripped before reaching the UI.

export type AnswerType =
  | "likert"
  | "directional_likert"
  | "multiple_choice"
  | "two_part_multiple_choice"
  | "free_text";

export interface ScaleLabels {
  "1": string;
  "2": string;
  "3": string;
  "4": string;
  "5": string;
}

export interface MultipleChoiceOption {
  option_id: string;
  label: string;
}

export interface SubPrompt {
  sub_id: string;
  prompt: string;
  context_domain: string;
  options: MultipleChoiceOption[];
}

export interface FreeTextOptions {
  min_chars: number;
  soft_max_chars: number;
  soft_min_recommended: number;
}

// Per-branch options shapes. Named aliases let the projector construct
// each branch directly without casting through `unknown`.
export interface LikertOptions {
  scale_labels: ScaleLabels;
}

export interface TwoPartOptions {
  sub_prompts: SubPrompt[];
}

// Discriminated union by answer_type. Each branch carries the exact options
// shape the UI needs and nothing more.
export interface LikertQuestion {
  id: number;
  answer_type: "likert";
  user_facing_item: string;
  options: LikertOptions;
}

export interface DirectionalLikertQuestion {
  id: number;
  answer_type: "directional_likert";
  user_facing_item: string;
  options: LikertOptions;
}

export interface MultipleChoiceQuestion {
  id: number;
  answer_type: "multiple_choice";
  user_facing_item: string;
  options: MultipleChoiceOption[];
}

export interface TwoPartMultipleChoiceQuestion {
  id: number;
  answer_type: "two_part_multiple_choice";
  user_facing_item: string;
  options: TwoPartOptions;
}

export interface FreeTextQuestion {
  id: number;
  answer_type: "free_text";
  user_facing_item: string;
  options: FreeTextOptions;
}

export type FrontendQuestion =
  | LikertQuestion
  | DirectionalLikertQuestion
  | MultipleChoiceQuestion
  | TwoPartMultipleChoiceQuestion
  | FreeTextQuestion;
