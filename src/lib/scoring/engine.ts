// Inner Compass Scoring Engine v1.1
//
// Pure, deterministic. No I/O. Same input → same output.
//
// Intended call site: netlify/functions/score.ts (server-only). The engine
// itself is plain TypeScript and could in principle be imported anywhere,
// but it MUST only be invoked from server contexts because it reads the
// raw question bank (which contains score_mapping, scoring_metadata, and
// internal_notes that must never reach the client).

import type {
  BankQuestion,
  CascadeEntry,
  DriverScore,
  PatternScore,
  ScoreMappingValue,
  ScoringCompleteness,
  ScoringResult,
  SignatureScore,
  SupportingDimension,
  ValidityBlock,
} from "./types";

// ---------------------------------------------------------------------------
// Constants — fixed by spec v1.1
// ---------------------------------------------------------------------------

export const ENGINE_VERSION = "inner_compass_scoring_v1.1";

// Item 32 is the free-text engagement-validity item. Per security spec its
// content is never processed or stored.
const FREE_TEXT_ITEM_ID = 32;

export const SIGNATURES = [
  "controller",
  "vanisher",
  "polisher",
  "fixer",
  "escalator",
  "over_explainer",
  "shutter",
  "accommodator",
  "critic",
  "sealed",
  "doubler",
] as const;

export const DRIVERS = [
  "hunger_to_matter",
  "hunger_to_be_seen",
  "hunger_for_control",
  "hunger_to_be_right",
  "hunger_for_safety",
  "hunger_to_be_loved",
  "hunger_for_freedom",
  "hunger_to_belong",
  "hunger_to_be_free_of_failure",
] as const;

export const CASCADE_PAIRINGS: Record<string, string> = {
  controller: "critic",
  vanisher: "over_explainer",
  polisher: "sealed",
  fixer: "accommodator",
  escalator: "shutter",
  over_explainer: "vanisher",
  shutter: "critic",
  accommodator: "critic",
  critic: "controller",
  sealed: "shutter",
  doubler: "escalator",
};

export const NAMED_PATTERNS = {
  the_performance_loop: {
    driver: "hunger_to_be_seen",
    signatures: ["polisher"],
    triggering_items: [3, 4, 26, 80],
  },
  the_fortress: {
    driver: "hunger_for_control",
    signatures: ["controller"],
    triggering_items: [2, 10],
  },
  the_loaded_carrier: {
    driver: "hunger_to_matter",
    signatures: ["sealed"],
    triggering_items: [11, 34, 74],
  },
  the_bargained_self: {
    driver: "hunger_to_be_loved",
    signatures: ["accommodator"],
    triggering_items: [18, 31, 53],
  },
  the_strategic_withdrawal: {
    driver: "hunger_to_be_free_of_failure",
    signatures: ["vanisher"],
    triggering_items: [6, 20, 49],
  },
  the_mission_bottleneck: {
    driver: "hunger_to_matter",
    signatures: ["controller", "doubler"],
    triggering_items: [44, 60],
  },
  the_audit: {
    driver: "hunger_for_control",
    signatures: ["critic"],
    triggering_items: [8],
  },
} as const;

export const SCORE_BANDS = {
  signature_activation: {
    quiet: [0, 35],
    present: [36, 60],
    strong: [61, 80],
    dominant: [81, 100],
  },
  recovery_cost: {
    very_low: [0, 24],
    low: [25, 44],
    medium: [45, 69],
    high: [70, 84],
    very_high: [85, 100],
  },
  driver_intensity: {
    quiet: [0, 35],
    present: [36, 60],
    strong: [61, 80],
    dominant: [81, 100],
  },
  driver_regulation: {
    strained: [0, 35],
    working: [36, 60],
    steady: [61, 80],
    mastered: [81, 100],
  },
  pattern_match: {
    weak: [0, 0.54],
    moderate: [0.55, 0.64],
    strong: [0.65, 0.79],
    very_strong: [0.8, 1.0],
  },
} as const;

// ---------------------------------------------------------------------------
// Internal accumulators
// ---------------------------------------------------------------------------

interface SignatureAcc {
  raw: number;
  max: number;
  items: number;
}

interface DriverIntensityAcc {
  raw: number;
  max: number;
}

interface DriverRegulationAcc {
  sum: number;
  weight_sum: number;
}

interface DriverItemAcc {
  items: number;
}

interface SupportingAcc {
  sum: number;
  weight_sum: number;
  items: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pickBand(
  value: number,
  bands: Record<string, readonly [number, number] | number[]>
): string {
  for (const [name, range] of Object.entries(bands)) {
    const [lo, hi] = range as [number, number];
    if (value >= lo && value <= hi) return name;
  }
  // Fallback: nearest band edge
  const entries = Object.entries(bands) as Array<
    [string, [number, number] | number[]]
  >;
  return entries[0][0];
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function asLikertNumber(answer: unknown): number | null {
  if (typeof answer === "string") {
    const n = parseInt(answer, 10);
    return Number.isFinite(n) ? n : null;
  }
  if (typeof answer === "number") {
    return Number.isFinite(answer) ? answer : null;
  }
  return null;
}

function isSignature(key: string): boolean {
  return (SIGNATURES as readonly string[]).includes(key);
}

function isDriver(key: string): boolean {
  return (DRIVERS as readonly string[]).includes(key);
}

function regulationDriverOf(key: string): string | null {
  if (!key.endsWith("_regulation")) return null;
  const driver = key.slice(0, -"_regulation".length);
  return isDriver(driver) ? driver : null;
}

function isRecoveryCostKey(key: string): boolean {
  return key.endsWith("_recovery_cost");
}

function isValidityKey(key: string): boolean {
  return key.startsWith("validity_");
}

// max value any answer option gives for a given construct on this item
function maxPerConstruct(
  mappingByAnswer: Record<string, ScoreMappingValue>
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const mapping of Object.values(mappingByAnswer)) {
    if (!isPlainObject(mapping)) continue;
    for (const [k, v] of Object.entries(mapping)) {
      if (typeof v === "number" && Number.isFinite(v)) {
        out[k] = Math.max(out[k] ?? -Infinity, v);
      }
    }
  }
  // Clean -Infinity entries
  for (const [k, v] of Object.entries(out)) {
    if (!Number.isFinite(v)) delete out[k];
  }
  return out;
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

export function runScoringEngine(
  responses: Record<number, { answer: unknown }>,
  questionBank: BankQuestion[]
): ScoringResult {
  // Build lookup once.
  const bankByItemId = new Map<number, BankQuestion>();
  for (const q of questionBank) {
    bankByItemId.set(q.id, q);
  }

  // Initialize accumulators for known constructs.
  const sigAcc: Record<string, SignatureAcc> = {};
  for (const s of SIGNATURES) sigAcc[s] = { raw: 0, max: 0, items: 0 };

  const drvIntAcc: Record<string, DriverIntensityAcc> = {};
  for (const d of DRIVERS) drvIntAcc[d] = { raw: 0, max: 0 };

  const drvRegAcc: Record<string, DriverRegulationAcc> = {};
  for (const d of DRIVERS) drvRegAcc[d] = { sum: 0, weight_sum: 0 };

  const drvItemAcc: Record<string, DriverItemAcc> = {};
  for (const d of DRIVERS) drvItemAcc[d] = { items: 0 };

  const supportingAcc: Record<string, SupportingAcc> = {};
  const categoricalAcc: Record<string, Record<string, number>> = {};
  const flags: Record<string, boolean> = {};
  const validityAcc: Record<string, unknown> = {};

  const likertAnswers: number[] = [];
  const scoredItemIds = new Set<number>();

  // ---------------------------------------------------------------------
  // Apply a single mapping (one answer's contribution) with a given weight.
  // ---------------------------------------------------------------------
  const applyMapping = (
    mapping: ScoreMappingValue,
    weight: number,
    contributingDrivers: Set<string>
  ) => {
    for (const [key, value] of Object.entries(mapping)) {
      // Boolean flags (independent of numeric/categorical)
      if (typeof value === "boolean") {
        if (value) flags[key] = true;
        continue;
      }

      // Categorical (string values, e.g. rupture_repair: 'direct')
      if (typeof value === "string") {
        if (!categoricalAcc[key]) categoricalAcc[key] = {};
        categoricalAcc[key][value] = (categoricalAcc[key][value] ?? 0) + 1;
        // Validity strings get mirrored into validityAcc too.
        if (isValidityKey(key)) {
          validityAcc[key] = value;
        }
        continue;
      }

      // Numeric contributions
      if (typeof value === "number" && Number.isFinite(value)) {
        const contribution = value * weight;

        // 1. Signature accumulators
        if (isSignature(key)) {
          sigAcc[key].raw += contribution;
          sigAcc[key].items += 1;
          continue;
        }

        // 2. Driver intensity
        if (isDriver(key)) {
          drvIntAcc[key].raw += contribution;
          contributingDrivers.add(key);
          continue;
        }

        // 3. Driver regulation (weighted average)
        const regDriver = regulationDriverOf(key);
        if (regDriver) {
          drvRegAcc[regDriver].sum += value * weight;
          drvRegAcc[regDriver].weight_sum += weight;
          contributingDrivers.add(regDriver);
          continue;
        }

        // 4. Recovery cost + any other dimension with `_recovery_cost` suffix
        if (isRecoveryCostKey(key)) {
          if (!supportingAcc[key])
            supportingAcc[key] = { sum: 0, weight_sum: 0, items: 0 };
          supportingAcc[key].sum += value * weight;
          supportingAcc[key].weight_sum += weight;
          supportingAcc[key].items += 1;
          continue;
        }

        // 5. Validity numeric
        if (isValidityKey(key)) {
          if (!supportingAcc[key])
            supportingAcc[key] = { sum: 0, weight_sum: 0, items: 0 };
          supportingAcc[key].sum += value * weight;
          supportingAcc[key].weight_sum += weight;
          supportingAcc[key].items += 1;
          validityAcc[key] = value;
          continue;
        }

        // 6. Generic / unknown numeric — bucket in supporting dimensions
        if (!supportingAcc[key])
          supportingAcc[key] = { sum: 0, weight_sum: 0, items: 0 };
        supportingAcc[key].sum += value * weight;
        supportingAcc[key].weight_sum += weight;
        supportingAcc[key].items += 1;
        continue;
      }

      // Anything else (null, undefined, nested object) is ignored.
    }
  };

  // ---------------------------------------------------------------------
  // Add max-possible contribution for one item (signatures + driver intensity)
  // ---------------------------------------------------------------------
  const addMaxPossible = (
    mappingByAnswer: Record<string, ScoreMappingValue>,
    weight: number
  ) => {
    const maxByKey = maxPerConstruct(mappingByAnswer);
    for (const [key, maxVal] of Object.entries(maxByKey)) {
      if (maxVal <= 0) continue;
      const contribution = maxVal * weight;
      if (isSignature(key)) {
        sigAcc[key].max += contribution;
      } else if (isDriver(key)) {
        drvIntAcc[key].max += contribution;
      }
    }
  };

  // ---------------------------------------------------------------------
  // Walk responses.
  // ---------------------------------------------------------------------
  for (const [itemIdStr, response] of Object.entries(responses)) {
    const itemId = parseInt(itemIdStr, 10);
    if (!Number.isFinite(itemId)) continue;
    if (itemId === FREE_TEXT_ITEM_ID) continue; // never process item 32

    const q = bankByItemId.get(itemId);
    if (!q) continue;
    if (q.answer_type === "free_text") continue; // defensive
    if (!q.score_mapping) continue;

    const weight = q.scoring_metadata?.weight ?? 1;
    const answer = response.answer;
    const contributingDrivers = new Set<string>();

    // Track likert answers for validity rules
    if (q.answer_type === "likert" || q.answer_type === "directional_likert") {
      const n = asLikertNumber(answer);
      if (n !== null) likertAnswers.push(n);
    }

    if (q.answer_type === "two_part_multiple_choice") {
      // Two-part: each sub-prompt gets a slice of the parent weight.
      if (!isPlainObject(answer)) continue;
      const optionsObj = q.options as { sub_prompts?: Array<{ sub_id: string; options: Array<{ option_id: string }> }> } | undefined;
      const subPrompts = optionsObj?.sub_prompts ?? [];
      if (subPrompts.length === 0) continue;
      const subWeight = weight / subPrompts.length;

      for (const sp of subPrompts) {
        const subAnswer = (answer as Record<string, unknown>)[sp.sub_id];
        if (typeof subAnswer !== "string") continue;

        const subMappingByAnswer = (q.score_mapping as Record<string, unknown>)[sp.sub_id];
        if (!isPlainObject(subMappingByAnswer)) continue;

        const subMapping = subMappingByAnswer[subAnswer];
        if (!isPlainObject(subMapping)) continue;

        applyMapping(subMapping as ScoreMappingValue, subWeight, contributingDrivers);
        addMaxPossible(
          subMappingByAnswer as Record<string, ScoreMappingValue>,
          subWeight
        );
      }
    } else {
      // Single-answer items (likert, directional_likert, multiple_choice)
      const key = String(answer);
      const mapping = (q.score_mapping as Record<string, unknown>)[key];
      if (!isPlainObject(mapping)) continue;

      applyMapping(mapping as ScoreMappingValue, weight, contributingDrivers);

      // max_possible across all answer options for this item
      const allOptions: Record<string, ScoreMappingValue> = {};
      for (const [k, v] of Object.entries(q.score_mapping)) {
        if (isPlainObject(v)) {
          allOptions[k] = v as ScoreMappingValue;
        }
      }
      addMaxPossible(allOptions, weight);
    }

    for (const d of contributingDrivers) {
      drvItemAcc[d].items += 1;
    }
    scoredItemIds.add(itemId);
  }

  // ---------------------------------------------------------------------
  // Normalize signatures → score + band
  // ---------------------------------------------------------------------
  const signatures: Record<string, SignatureScore> = {};
  for (const s of SIGNATURES) {
    const acc = sigAcc[s];
    const score =
      acc.max > 0 ? Math.round((acc.raw / acc.max) * 100) : 0;
    signatures[s] = {
      raw: round2(acc.raw),
      max_possible: round2(acc.max),
      score,
      band: pickBand(score, SCORE_BANDS.signature_activation),
      items_contributing: acc.items,
    };
  }

  // ---------------------------------------------------------------------
  // Normalize drivers → intensity + regulation
  // ---------------------------------------------------------------------
  const drivers: Record<string, DriverScore> = {};
  for (const d of DRIVERS) {
    const intAcc = drvIntAcc[d];
    const intScore =
      intAcc.max > 0 ? Math.round((intAcc.raw / intAcc.max) * 100) : 0;

    const regAcc = drvRegAcc[d];
    const regScore =
      regAcc.weight_sum > 0
        ? Math.round(regAcc.sum / regAcc.weight_sum)
        : 0;

    drivers[d] = {
      intensity: {
        raw: round2(intAcc.raw),
        max_possible: round2(intAcc.max),
        score: intScore,
        band: pickBand(intScore, SCORE_BANDS.driver_intensity),
      },
      regulation: {
        sum: round2(regAcc.sum),
        weight_sum: round2(regAcc.weight_sum),
        score: regScore,
        band: pickBand(regScore, SCORE_BANDS.driver_regulation),
      },
      items_contributing: drvItemAcc[d].items,
    };
  }

  // ---------------------------------------------------------------------
  // Supporting dimensions — weighted averages
  // ---------------------------------------------------------------------
  const supporting_dimensions: Record<string, SupportingDimension> = {};
  for (const [key, acc] of Object.entries(supportingAcc)) {
    const weighted_average =
      acc.weight_sum > 0 ? round2(acc.sum / acc.weight_sum) : 0;
    const entry: SupportingDimension = {
      sum: round2(acc.sum),
      weight_sum: round2(acc.weight_sum),
      weighted_average,
      items_contributing: acc.items,
    };
    if (isRecoveryCostKey(key)) {
      entry.band = pickBand(weighted_average, SCORE_BANDS.recovery_cost);
    }
    supporting_dimensions[key] = entry;
  }

  // ---------------------------------------------------------------------
  // Patterns
  // ---------------------------------------------------------------------
  const patterns: Record<string, PatternScore> = {};
  for (const [name, def] of Object.entries(NAMED_PATTERNS)) {
    const driverScore = drivers[def.driver]?.intensity.score ?? 0;
    const sigScores = def.signatures.map(
      (s) => signatures[s]?.score ?? 0
    );
    const avgSig =
      sigScores.length > 0
        ? sigScores.reduce((a, b) => a + b, 0) / sigScores.length
        : 0;

    // Triggering-items evidence: how many of the pattern's expected items
    // had answers that contributed to one of the pattern's signatures.
    let triggeringMatches = 0;
    for (const itemId of def.triggering_items) {
      const r = responses[itemId];
      if (!r) continue;
      const q = bankByItemId.get(itemId);
      if (!q?.score_mapping) continue;

      // For two-part items, check all sub-prompts collectively.
      if (q.answer_type === "two_part_multiple_choice") {
        if (!isPlainObject(r.answer)) continue;
        let matched = false;
        for (const [subId, subAnswer] of Object.entries(r.answer)) {
          if (typeof subAnswer !== "string") continue;
          const subMappingByAnswer = (q.score_mapping as Record<string, unknown>)[subId];
          if (!isPlainObject(subMappingByAnswer)) continue;
          const subMapping = subMappingByAnswer[subAnswer];
          if (!isPlainObject(subMapping)) continue;
          if (def.signatures.some((sig) => {
            const v = (subMapping as Record<string, unknown>)[sig];
            return typeof v === "number" && v > 0;
          })) {
            matched = true;
            break;
          }
        }
        if (matched) triggeringMatches += 1;
      } else {
        const mapping = (q.score_mapping as Record<string, unknown>)[
          String(r.answer)
        ];
        if (!isPlainObject(mapping)) continue;
        const hit = def.signatures.some((sig) => {
          const v = (mapping as Record<string, unknown>)[sig];
          return typeof v === "number" && v > 0;
        });
        if (hit) triggeringMatches += 1;
      }
    }

    const driverNorm = driverScore / 100;
    const sigNorm = avgSig / 100;
    const triggerNorm =
      def.triggering_items.length > 0
        ? triggeringMatches / def.triggering_items.length
        : 0;

    // Weighted blend: driver 30%, signature 40%, triggering items 30%.
    const match = Math.min(
      1,
      Math.max(0, driverNorm * 0.3 + sigNorm * 0.4 + triggerNorm * 0.3)
    );

    patterns[name] = {
      match: round2(match),
      band: pickBand(match, SCORE_BANDS.pattern_match),
      driver: def.driver,
      signatures: [...def.signatures],
      triggering_items_matched: triggeringMatches,
      triggering_items_total: def.triggering_items.length,
    };
  }

  // ---------------------------------------------------------------------
  // Cascades — only emitted when primary is at least "present" (>=36)
  // ---------------------------------------------------------------------
  const cascades: CascadeEntry[] = [];
  for (const [primary, cascade] of Object.entries(CASCADE_PAIRINGS)) {
    const primaryScore = signatures[primary]?.score ?? 0;
    if (primaryScore < 36) continue;
    const cascadeScore = signatures[cascade]?.score ?? 0;
    cascades.push({
      primary_signature: primary,
      cascade_signature: cascade,
      primary_score: primaryScore,
      cascade_score: cascadeScore,
      paired_strength: Math.round((primaryScore + cascadeScore) / 2),
    });
  }
  cascades.sort((a, b) => b.paired_strength - a.paired_strength);

  // ---------------------------------------------------------------------
  // Validity
  // ---------------------------------------------------------------------
  const validity = computeValidity(responses, likertAnswers);

  // ---------------------------------------------------------------------
  // Primary fields (highest score / match)
  // ---------------------------------------------------------------------
  const primary_signature = topByScore(signatures, (s) => s.score);
  const primary_driver = topByScore(drivers, (d) => d.intensity.score);
  const primary_pattern = topByScore(patterns, (p) => p.match);

  // ---------------------------------------------------------------------
  // Completeness — expect 83 items (84 minus item 32)
  // ---------------------------------------------------------------------
  const scoredEligibleItemIds = new Set<number>();
  for (const q of questionBank) {
    if (q.id === FREE_TEXT_ITEM_ID) continue;
    if (q.answer_type === "free_text") continue;
    if (!q.score_mapping) continue;
    scoredEligibleItemIds.add(q.id);
  }
  const items_missing: number[] = [];
  for (const id of scoredEligibleItemIds) {
    if (!scoredItemIds.has(id)) items_missing.push(id);
  }
  items_missing.sort((a, b) => a - b);

  const completeness: ScoringCompleteness = {
    items_expected: scoredEligibleItemIds.size,
    items_scored: scoredItemIds.size,
    items_missing,
    is_complete: items_missing.length === 0,
  };

  // Merge flags from validityAcc that are booleans into the flags bucket
  for (const [k, v] of Object.entries(validityAcc)) {
    if (typeof v === "boolean" && v) flags[k] = true;
  }

  return {
    engine_version: ENGINE_VERSION,
    scored_at: new Date().toISOString(),
    primary_signature,
    primary_driver,
    primary_pattern,
    validity_confidence: validity.validity_confidence,
    signatures,
    drivers,
    patterns,
    cascades,
    supporting_dimensions,
    categorical: categoricalAcc,
    flags,
    validity,
    completeness,
  };
}

// ---------------------------------------------------------------------------
// Validity computation
// ---------------------------------------------------------------------------

function computeValidity(
  responses: Record<number, { answer: unknown }>,
  likertAnswers: number[]
): ValidityBlock {
  const item1 = asLikertNumber(responses[1]?.answer);
  const item21 = asLikertNumber(responses[21]?.answer);
  const item55 = asLikertNumber(responses[55]?.answer);
  const item83 = asLikertNumber(responses[83]?.answer);

  // Rule 1: reverse_coded_inconsistency
  let reverseTriggered = false;
  let reverseDetail = "insufficient_data";
  if (item1 !== null && item21 !== null) {
    const diff = Math.abs(item1 - (6 - item21));
    reverseTriggered = diff >= 2;
    reverseDetail = `item1=${item1}, item21=${item21}, |item1-(6-item21)|=${diff}`;
  }

  // Rule 2: social_desirability_flag
  const socialTriggered = item55 !== null && item55 >= 4;
  const socialDetail =
    item55 !== null ? `item55=${item55}` : "item55_missing";

  // Rule 3: contradiction_flag
  const contradictionTriggered =
    item1 !== null && item83 !== null && item1 >= 4 && item83 >= 4;
  const contradictionDetail =
    item1 !== null && item83 !== null
      ? `item1=${item1}, item83=${item83}`
      : "insufficient_data";

  // Rule 4: extreme_responding (>40% of likert answers are 1 or 5)
  let extremeTriggered = false;
  let extremeDetail = "no_likert_answers";
  if (likertAnswers.length > 0) {
    const extreme = likertAnswers.filter((a) => a === 1 || a === 5).length;
    const pct = extreme / likertAnswers.length;
    extremeTriggered = pct > 0.4;
    extremeDetail = `${extreme}/${likertAnswers.length} extreme (${round2(pct)})`;
  }

  // Rule 5: neutral_overuse (>50% of likert answers are 3)
  let neutralTriggered = false;
  let neutralDetail = "no_likert_answers";
  if (likertAnswers.length > 0) {
    const neutral = likertAnswers.filter((a) => a === 3).length;
    const pct = neutral / likertAnswers.length;
    neutralTriggered = pct > 0.5;
    neutralDetail = `${neutral}/${likertAnswers.length} neutral (${round2(pct)})`;
  }

  const flagCount = [
    reverseTriggered,
    socialTriggered,
    contradictionTriggered,
    extremeTriggered,
    neutralTriggered,
  ].filter(Boolean).length;

  let confidence: ValidityBlock["validity_confidence"];
  if (flagCount === 0) confidence = "high";
  else if (flagCount <= 2) confidence = "good";
  else if (flagCount <= 4) confidence = "moderate";
  else confidence = "low";

  return {
    reverse_coded_inconsistency: { triggered: reverseTriggered, detail: reverseDetail },
    social_desirability_flag: { triggered: socialTriggered, detail: socialDetail },
    contradiction_flag: { triggered: contradictionTriggered, detail: contradictionDetail },
    extreme_responding: { triggered: extremeTriggered, detail: extremeDetail },
    neutral_overuse: { triggered: neutralTriggered, detail: neutralDetail },
    flag_count: flagCount,
    validity_confidence: confidence,
  };
}

// ---------------------------------------------------------------------------
// Misc helpers
// ---------------------------------------------------------------------------

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function topByScore<T>(
  map: Record<string, T>,
  getScore: (t: T) => number
): string | null {
  let bestKey: string | null = null;
  let bestScore = -Infinity;
  for (const [k, v] of Object.entries(map)) {
    const s = getScore(v);
    if (s > bestScore) {
      bestScore = s;
      bestKey = k;
    }
  }
  // Don't return a primary when literally nothing was scored.
  if (bestScore <= 0) return null;
  return bestKey;
}
