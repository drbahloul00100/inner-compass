// This file imports the FRONTEND-SAFE projected bank, not the source bank.
// The source bank (src/data/question-bank-v1.json) contains scoring_metadata,
// score_mapping, and internal_notes. Those fields must never enter the client
// bundle. The build script `scripts/project-bank.mjs` projects the source to
// a frontend-safe file at build time (run by `npm run prebuild`), and that
// safe file is what gets imported here.
//
// Two layers of defense:
//   1. Build time: the projector strips sensitive fields before bundling.
//   2. Runtime: the validators below confirm shape and refuse malformed data.

import rawBank from "@/data/.generated/question-bank-frontend.json";
import type {
  FrontendQuestion,
  ScaleLabels,
  MultipleChoiceOption,
  SubPrompt,
  FreeTextOptions,
} from "@/types/question";

interface RawSubPrompt {
  sub_id?: unknown;
  prompt?: unknown;
  context_domain?: unknown;
  options?: unknown;
}

interface RawQuestion {
  id?: unknown;
  user_facing_item?: unknown;
  answer_type?: unknown;
  options?: unknown;
}

interface RawBank {
  version?: unknown;
  total_items?: unknown;
  questions?: unknown;
}

function asString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new Error(`Expected string for ${field}, got ${typeof value}`);
  }
  return value;
}

function asNumber(value: unknown, field: string): number {
  if (typeof value !== "number") {
    throw new Error(`Expected number for ${field}, got ${typeof value}`);
  }
  return value;
}

function asObject(value: unknown, field: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Expected object for ${field}`);
  }
  return value as Record<string, unknown>;
}

function asArray(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`Expected array for ${field}`);
  }
  return value;
}

function projectScaleLabels(raw: unknown, itemId: number): ScaleLabels {
  const obj = asObject(raw, `item ${itemId} scale_labels`);
  return {
    "1": asString(obj["1"], `item ${itemId} scale_labels.1`),
    "2": asString(obj["2"], `item ${itemId} scale_labels.2`),
    "3": asString(obj["3"], `item ${itemId} scale_labels.3`),
    "4": asString(obj["4"], `item ${itemId} scale_labels.4`),
    "5": asString(obj["5"], `item ${itemId} scale_labels.5`),
  };
}

function projectMultipleChoiceOptions(
  raw: unknown,
  itemId: number,
  context: string
): MultipleChoiceOption[] {
  const arr = asArray(raw, `item ${itemId} ${context} options`);
  return arr.map((opt, idx) => {
    const o = asObject(opt, `item ${itemId} ${context} options[${idx}]`);
    return {
      option_id: asString(
        o.option_id,
        `item ${itemId} ${context} options[${idx}].option_id`
      ),
      label: asString(
        o.label,
        `item ${itemId} ${context} options[${idx}].label`
      ),
    };
  });
}

function projectSubPrompts(raw: unknown, itemId: number): SubPrompt[] {
  const obj = asObject(raw, `item ${itemId} options`);
  const subPromptsRaw = asArray(
    obj.sub_prompts,
    `item ${itemId} options.sub_prompts`
  );
  return subPromptsRaw.map((sp, idx) => {
    const s = sp as RawSubPrompt;
    return {
      sub_id: asString(s.sub_id, `item ${itemId} sub_prompts[${idx}].sub_id`),
      prompt: asString(
        s.prompt,
        `item ${itemId} sub_prompts[${idx}].prompt`
      ),
      context_domain: asString(
        s.context_domain,
        `item ${itemId} sub_prompts[${idx}].context_domain`
      ),
      options: projectMultipleChoiceOptions(
        s.options,
        itemId,
        `sub_prompt ${idx}`
      ),
    };
  });
}

function projectFreeTextOptions(
  raw: unknown,
  itemId: number
): FreeTextOptions {
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

function projectQuestion(raw: RawQuestion): FrontendQuestion {
  const id = asNumber(raw.id, "question.id");
  const user_facing_item = asString(
    raw.user_facing_item,
    `item ${id} user_facing_item`
  );
  const answer_type = asString(raw.answer_type, `item ${id} answer_type`);

  switch (answer_type) {
    case "likert": {
      const optionsObj = asObject(raw.options, `item ${id} options`);
      const scale_labels = projectScaleLabels(optionsObj.scale_labels, id);
      return {
        id,
        answer_type: "likert",
        user_facing_item,
        options: { scale_labels },
      };
    }

    case "directional_likert": {
      const optionsObj = asObject(raw.options, `item ${id} options`);
      const scale_labels = projectScaleLabels(optionsObj.scale_labels, id);
      return {
        id,
        answer_type: "directional_likert",
        user_facing_item,
        options: { scale_labels },
      };
    }

    case "multiple_choice": {
      const options = projectMultipleChoiceOptions(raw.options, id, "main");
      return {
        id,
        answer_type: "multiple_choice",
        user_facing_item,
        options,
      };
    }

    case "two_part_multiple_choice": {
      const sub_prompts = projectSubPrompts(raw.options, id);
      return {
        id,
        answer_type: "two_part_multiple_choice",
        user_facing_item,
        options: { sub_prompts },
      };
    }

    case "free_text": {
      const options = projectFreeTextOptions(raw.options, id);
      return {
        id,
        answer_type: "free_text",
        user_facing_item,
        options,
      };
    }

    default:
      throw new Error(
        `Unknown answer_type "${answer_type}" on item ${id}`
      );
  }
}

// ---------- Public exports ----------

const bank = rawBank as RawBank;

if (!Array.isArray(bank.questions)) {
  throw new Error(
    "Frontend question bank is malformed: expected questions to be an array. " +
      "Run `npm run prebuild` to regenerate it from the source bank."
  );
}

export const BANK_VERSION: string =
  typeof bank.version === "string" ? bank.version : "unknown";

export const QUESTIONS: FrontendQuestion[] = (bank.questions as RawQuestion[])
  .map(projectQuestion)
  .sort((a, b) => a.id - b.id);

export const TOTAL_ITEMS = QUESTIONS.length;

export function getQuestionById(id: number): FrontendQuestion | undefined {
  return QUESTIONS.find((q) => q.id === id);
}

export function getQuestionByIndex(
  index: number
): FrontendQuestion | undefined {
  return QUESTIONS[index];
}
