// Build-time projector: reads the source question bank (which contains
// scoring_metadata, score_mapping, and internal_notes) and writes ONLY
// the frontend-safe projection to a separate file that the client imports.
//
// This script runs as a prebuild step. The frontend never imports the
// source file directly, so sensitive scoring fields never enter the
// client bundle.
//
// Run via: npm run build (which runs `prebuild` first)
// Or manually: node scripts/project-bank.mjs

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Source: bilingual bank with { en, ar } on user-facing strings.
// Falls back to the English-only bank if the localized file is missing —
// this keeps the build working even if someone deletes the bilingual file.
const LOCALIZED_PATH = resolve(__dirname, "../src/data/question-bank-v1.localized.json");
const FALLBACK_PATH = resolve(__dirname, "../src/data/question-bank-v1.json");
const OUTPUT_DIR = resolve(__dirname, "../src/data/.generated");
const OUTPUT_PATH = resolve(OUTPUT_DIR, "question-bank-frontend.json");

// Accepts a plain string or a {en, ar} bilingual object.
function asLocalizedString(value, field) {
  if (typeof value === "string") return value;
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    if (typeof value.en === "string") {
      return typeof value.ar === "string"
        ? { en: value.en, ar: value.ar }
        : value.en;
    }
  }
  throw new Error(
    `Expected string or {en, ar} object for ${field}, got ${typeof value}`
  );
}

function asNumber(value, field) {
  if (typeof value !== "number") {
    throw new Error(`Expected number for ${field}, got ${typeof value}`);
  }
  return value;
}

function asString(value, field) {
  if (typeof value !== "string") {
    throw new Error(`Expected string for ${field}, got ${typeof value}`);
  }
  return value;
}

function asObject(value, field) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Expected object for ${field}`);
  }
  return value;
}

function asArray(value, field) {
  if (!Array.isArray(value)) {
    throw new Error(`Expected array for ${field}`);
  }
  return value;
}

function projectScaleLabels(raw, itemId) {
  const obj = asObject(raw, `item ${itemId} scale_labels`);
  return {
    "1": asLocalizedString(obj["1"], `item ${itemId} scale_labels.1`),
    "2": asLocalizedString(obj["2"], `item ${itemId} scale_labels.2`),
    "3": asLocalizedString(obj["3"], `item ${itemId} scale_labels.3`),
    "4": asLocalizedString(obj["4"], `item ${itemId} scale_labels.4`),
    "5": asLocalizedString(obj["5"], `item ${itemId} scale_labels.5`),
  };
}

function projectMultipleChoiceOptions(raw, itemId, context) {
  const arr = asArray(raw, `item ${itemId} ${context} options`);
  return arr.map((opt, idx) => {
    const o = asObject(opt, `item ${itemId} ${context} options[${idx}]`);
    return {
      option_id: asString(
        o.option_id,
        `item ${itemId} ${context} options[${idx}].option_id`
      ),
      label: asLocalizedString(
        o.label,
        `item ${itemId} ${context} options[${idx}].label`
      ),
    };
  });
}

function projectSubPrompts(raw, itemId) {
  const obj = asObject(raw, `item ${itemId} options`);
  const subPromptsRaw = asArray(
    obj.sub_prompts,
    `item ${itemId} options.sub_prompts`
  );
  return subPromptsRaw.map((sp, idx) => ({
    sub_id: asString(sp.sub_id, `item ${itemId} sub_prompts[${idx}].sub_id`),
    prompt: asLocalizedString(
      sp.prompt,
      `item ${itemId} sub_prompts[${idx}].prompt`
    ),
    context_domain: asString(
      sp.context_domain,
      `item ${itemId} sub_prompts[${idx}].context_domain`
    ),
    options: projectMultipleChoiceOptions(
      sp.options,
      itemId,
      `sub_prompt ${idx}`
    ),
  }));
}

function projectFreeTextOptions(raw, itemId) {
  const obj = asObject(raw, `item ${itemId} options`);
  return {
    min_chars: asNumber(obj.min_chars, `item ${itemId} options.min_chars`),
    soft_max_chars: asNumber(
      obj.soft_max_chars,
      `item ${itemId} options.soft_max_chars`
    ),
    soft_min_recommended: asNumber(
      obj.soft_min_recommended,
      `item ${itemId} options.soft_min_recommended`
    ),
  };
}

function projectQuestion(raw) {
  const id = asNumber(raw.id, "question.id");
  const user_facing_item = asLocalizedString(
    raw.user_facing_item,
    `item ${id} user_facing_item`
  );
  const answer_type = asString(raw.answer_type, `item ${id} answer_type`);

  switch (answer_type) {
    case "likert":
    case "directional_likert": {
      const optionsObj = asObject(raw.options, `item ${id} options`);
      return {
        id,
        answer_type,
        user_facing_item,
        options: { scale_labels: projectScaleLabels(optionsObj.scale_labels, id) },
      };
    }
    case "multiple_choice": {
      return {
        id,
        answer_type,
        user_facing_item,
        options: projectMultipleChoiceOptions(raw.options, id, "main"),
      };
    }
    case "two_part_multiple_choice": {
      return {
        id,
        answer_type,
        user_facing_item,
        options: { sub_prompts: projectSubPrompts(raw.options, id) },
      };
    }
    case "free_text": {
      return {
        id,
        answer_type,
        user_facing_item,
        options: projectFreeTextOptions(raw.options, id),
      };
    }
    default:
      throw new Error(`Unknown answer_type "${answer_type}" on item ${id}`);
  }
}

// ---------- Run ----------

const SOURCE_PATH = existsSync(LOCALIZED_PATH) ? LOCALIZED_PATH : FALLBACK_PATH;

console.log(`[project-bank] Reading source from ${SOURCE_PATH}`);
const raw = JSON.parse(readFileSync(SOURCE_PATH, "utf-8"));

if (!Array.isArray(raw.questions)) {
  throw new Error(
    "Source bank is malformed: expected `questions` to be an array"
  );
}

console.log(`[project-bank] Projecting ${raw.questions.length} questions`);
const projected = {
  version: typeof raw.version === "string" ? raw.version : "unknown",
  total_items: raw.questions.length,
  questions: raw.questions
    .map(projectQuestion)
    .sort((a, b) => a.id - b.id),
};

mkdirSync(OUTPUT_DIR, { recursive: true });
writeFileSync(OUTPUT_PATH, JSON.stringify(projected, null, 2), "utf-8");

console.log(
  `[project-bank] Wrote ${projected.questions.length} frontend-safe questions to ${OUTPUT_PATH}`
);
console.log(
  `[project-bank] Source bank scoring metadata is NOT included in the projection.`
);
