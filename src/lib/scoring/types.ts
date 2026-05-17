// Scoring engine v1.1 types.
//
// These types describe the output of runScoringEngine. They are intentionally
// permissive on input (Record<number, { answer: unknown }>) so the engine
// can defensively handle whatever the question bank throws at it.

export type Band = string;

export interface SignatureScore {
  raw: number;            // accumulated weighted contribution
  max_possible: number;   // sum of max-per-item contributions
  score: number;          // 0-100 normalized
  band: Band;             // 'quiet' | 'present' | 'strong' | 'dominant'
  items_contributing: number;
}

export interface DriverIntensityScore {
  raw: number;
  max_possible: number;
  score: number;          // 0-100 normalized
  band: Band;             // 'quiet' | 'present' | 'strong' | 'dominant'
}

export interface DriverRegulationScore {
  sum: number;
  weight_sum: number;
  score: number;          // weighted average (expected 15-90 per spec)
  band: Band;             // 'strained' | 'working' | 'steady' | 'mastered'
}

export interface DriverScore {
  intensity: DriverIntensityScore;
  regulation: DriverRegulationScore;
  items_contributing: number;
}

export interface PatternScore {
  match: number;          // 0-1
  band: Band;             // 'weak' | 'moderate' | 'strong' | 'very_strong'
  driver: string;
  signatures: string[];
  triggering_items_matched: number;
  triggering_items_total: number;
}

export interface CascadeEntry {
  primary_signature: string;
  cascade_signature: string;
  primary_score: number;
  cascade_score: number;
  paired_strength: number;
}

export interface SupportingDimension {
  sum: number;
  weight_sum: number;
  weighted_average: number;
  items_contributing: number;
  band?: Band;            // present when key suffix matches a known band group
}

export interface ValidityRuleResult {
  triggered: boolean;
  detail: string;
}

export interface ValidityBlock {
  reverse_coded_inconsistency: ValidityRuleResult;
  social_desirability_flag: ValidityRuleResult;
  contradiction_flag: ValidityRuleResult;
  extreme_responding: ValidityRuleResult;
  neutral_overuse: ValidityRuleResult;
  flag_count: number;
  validity_confidence: "high" | "good" | "moderate" | "low";
}

export interface ScoringCompleteness {
  items_expected: number;       // 83 (excludes item 32)
  items_scored: number;
  items_missing: number[];      // ids that should have been scored but weren't
  is_complete: boolean;
}

export interface ScoringResult {
  engine_version: string;
  scored_at: string;

  // Top-level convenience fields for fast dashboard/report queries.
  primary_signature: string | null;
  primary_driver: string | null;
  primary_pattern: string | null;
  validity_confidence: ValidityBlock["validity_confidence"];

  signatures: Record<string, SignatureScore>;
  drivers: Record<string, DriverScore>;
  patterns: Record<string, PatternScore>;
  cascades: CascadeEntry[];
  supporting_dimensions: Record<string, SupportingDimension>;
  categorical: Record<string, Record<string, number>>;
  flags: Record<string, boolean>;
  validity: ValidityBlock;
  completeness: ScoringCompleteness;
}

// Minimal shape of a question from the source bank. The engine uses these
// fields; everything else (user_facing_item localizations, internal_notes)
// is ignored.
export interface BankQuestion {
  id: number;
  answer_type:
    | "likert"
    | "directional_likert"
    | "multiple_choice"
    | "two_part_multiple_choice"
    | "free_text";
  scoring_metadata?: {
    primary_construct?: string | null;
    secondary_construct?: string | null;
    score_dimension?: string | null;
    domain?: string | null;
    weight?: number | null;
    reverse_coded?: boolean;
    interaction_pattern?: string | null;
  };
  score_mapping?: ScoreMappingValue;
  options?: unknown;
}

// score_mapping shape varies wildly by question type. We use `unknown` and
// narrow inside the engine.
export type ScoreMappingValue = Record<string, unknown>;
