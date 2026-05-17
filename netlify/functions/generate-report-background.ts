// Netlify Background Function: POST /.netlify/functions/generate-report-background
//
// The `-background` suffix in the filename tells Netlify to invoke this as a
// background function: the runtime responds 202 Accepted immediately to the
// caller and lets this function continue executing for up to 15 minutes.
// Background functions are billable per-second under the Pro plan; we expect
// this one to run for ~20-90 seconds (one Anthropic Sonnet 4.5 generation).
//
// Because the caller doesn't get the response payload, the function writes
// the generated report DIRECTLY back into Supabase using the service-role
// key. The /report/[session_id] page polls scoring_results.report_text every
// 3 seconds to detect completion.
//
// Required env vars (set on Netlify, in .env.local for dev):
//   - ANTHROPIC_API_KEY
//   - NEXT_PUBLIC_SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY   (server-only — NEVER expose to client)

import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT_BASE = `You are the Inner Compass report writer. Write a personal self-awareness report based on the scoring data provided. 1,200-1,500 words total. Write in flowing paragraphs only — no bullet points, no lists, no numbered items.

Tone: second person ("you"), warm but direct, no clinical or therapy language. Be specific and personal — name the actual signature, driver, and pattern from the data. Never use generic placeholders.

Structure the report as exactly 7 sections. Each section header must appear on its own line, prefixed with "## ", followed by a blank line, then the section's paragraphs:

## Who You Become Under Pressure
2-3 paragraphs. How the primary signature shows up in real moments. Make this vivid and recognizable.

## The Pressure Signature
2 paragraphs. What this signature is, when it activates, what it's protecting. Name the signature directly.

## The Inner Driver
2 paragraphs. The deeper hunger underneath the signature. Name the primary driver directly. Connect it to the behavioral surface.

## The Behavioral Pattern
2 paragraphs. How the signature + driver combine into the primary pattern. Name the pattern directly. Describe how it plays out across work and relationships.

## What This Costs You
2 paragraphs. Real costs in work and relationships. Be specific, not generic. Reference the regulation scores if they suggest depletion.

## The Hidden Strength
1-2 paragraphs. The genuine strength inside this profile — what the same signature, used consciously, gives you.

## Closing
1 paragraph. Warm, direct, grounded. Not motivational, not clinical. Acknowledge the work of self-knowledge.`;

const ARABIC_INSTRUCTION = `

LANGUAGE: ARABIC. Write the entire report in natural Modern Standard Arabic — never literal translation, never English mid-sentence.

Section headers in Arabic (use these exact phrases, prefixed with "## "):
## من تصبح تحت الضغط
## الصفة الأساسية
## المحرك الداخلي
## النمط السلوكي
## التكلفة الحقيقية
## القوة الخفية
## خلاصة

Use these EXACT Arabic terms for signature / driver / pattern names — do not invent alternatives:
Signatures: controller→المتحكم, vanisher→المتغيب, polisher→المُلمِّع, fixer→المُصلح, escalator→المُصعِّد, over_explainer→المُبرِّر, shutter→المُغلِق, accommodator→المُهادِن, critic→الناقد, sealed→المكتوم, doubler→المُضاعِف
Drivers: hunger_to_matter→الحاجة للأهمية, hunger_to_be_seen→الحاجة للظهور, hunger_for_control→الحاجة للسيطرة, hunger_to_be_right→الحاجة للصواب, hunger_for_safety→الحاجة للأمان, hunger_to_be_loved→الحاجة للمحبة, hunger_for_freedom→الحاجة للحرية, hunger_to_belong→الحاجة للانتماء, hunger_to_be_free_of_failure→الحاجة لتجنب الفشل
Patterns: the_performance_loop→دائرة الأداء, the_fortress→القلعة, the_loaded_carrier→الحامل المثقل, the_bargained_self→الذات المُساوَمة, the_strategic_withdrawal→الانسحاب الاستراتيجي, the_mission_bottleneck→عنق الزجاجة, the_audit→التدقيق

Use Western digits (1, 2, 3) for any numbers. Do not include the English construct names alongside the Arabic ones.`;

const MODEL_ID = "claude-sonnet-4-5";
// 3000 tokens ≈ 1500-1800 English words (or ~1200-1500 Arabic words via
// the model's tokenizer). Headroom for the 1,200-1,500 word target.
const MAX_TOKENS = 3000;

// ---------------------------------------------------------------------------
// Function
// ---------------------------------------------------------------------------

interface RequestBody {
  session_id?: unknown;
  scoring_json?: unknown;
  language?: unknown;
}

const log = (...args: unknown[]) => {
  // eslint-disable-next-line no-console
  console.log("[generate-report-bg]", ...args);
};

const logError = (...args: unknown[]) => {
  // eslint-disable-next-line no-console
  console.error("[generate-report-bg]", ...args);
};

// Background functions: Netlify responds 202 to the caller automatically.
// Our return value is ignored. The function keeps executing until either
// it finishes or the 15-minute timeout fires. All outcomes (success /
// API error / DB error / missing env) are logged to the Netlify function
// logs so we can debug from the dashboard.
export default async (req: Request): Promise<void> => {
  if (req.method !== "POST") {
    logError("non_post_method:", req.method);
    return;
  }

  // ---- Env vars ----
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!apiKey) return void logError("missing ANTHROPIC_API_KEY");
  if (!supabaseUrl) return void logError("missing NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceKey) return void logError("missing SUPABASE_SERVICE_ROLE_KEY");

  // ---- Parse body ----
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch (e) {
    logError("invalid_json:", e);
    return;
  }

  if (typeof body.session_id !== "string" || body.session_id.length === 0) {
    return void logError("missing session_id");
  }
  if (!body.scoring_json || typeof body.scoring_json !== "object") {
    return void logError("missing scoring_json");
  }
  const language: "en" | "ar" = body.language === "ar" ? "ar" : "en";

  const sessionId = body.session_id;
  log("start", { sessionId, language });

  const system =
    language === "ar" ? SYSTEM_PROMPT_BASE + ARABIC_INSTRUCTION : SYSTEM_PROMPT_BASE;
  const userMessage =
    language === "ar"
      ? `بيانات التحليل لهذه الجلسة:\n\n\`\`\`json\n${JSON.stringify(body.scoring_json, null, 2)}\n\`\`\`\n\nاكتب التقرير الكامل وفق البنية المحددة في النظام.`
      : `Here is the scoring data for this session:\n\n\`\`\`json\n${JSON.stringify(body.scoring_json, null, 2)}\n\`\`\`\n\nWrite the full 7-section report following the structure exactly.`;

  // ---- Call Claude ----
  const startMs = Date.now();
  let apiResponse: Response;
  try {
    apiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_ID,
        max_tokens: MAX_TOKENS,
        system,
        messages: [{ role: "user", content: userMessage }],
      }),
    });
  } catch (e) {
    return void logError("anthropic fetch threw:", e);
  }

  if (!apiResponse.ok) {
    const text = await apiResponse.text().catch(() => "");
    return void logError(
      "anthropic non-ok:",
      apiResponse.status,
      text.slice(0, 500)
    );
  }

  let apiBody: {
    content?: Array<{ type?: string; text?: string }>;
    stop_reason?: string;
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  try {
    apiBody = await apiResponse.json();
  } catch (e) {
    return void logError("anthropic non-json response:", e);
  }

  const reportText =
    apiBody.content
      ?.filter((b) => b?.type === "text" && typeof b.text === "string")
      .map((b) => b.text as string)
      .join("\n\n")
      .trim() ?? "";

  if (!reportText) {
    return void logError("anthropic empty content", apiBody);
  }

  const elapsedMs = Date.now() - startMs;
  log("claude ok", {
    elapsedMs,
    chars: reportText.length,
    input_tokens: apiBody.usage?.input_tokens,
    output_tokens: apiBody.usage?.output_tokens,
  });

  // ---- Persist to Supabase (service-role bypasses RLS) ----
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: updateError } = await supabase
    .from("scoring_results")
    .update({
      report_text: reportText,
      report_generated_at: new Date().toISOString(),
    })
    .eq("session_id", sessionId);

  if (updateError) {
    return void logError("supabase update error:", updateError);
  }

  log("done", { sessionId, elapsedMs });
};
