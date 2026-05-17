// Netlify Function (synchronous): POST /api/generate-report
//
// Why sync, not background:
//   We previously tried a Netlify Background Function (filename ending in
//   `-background`). On the Pro plan it should accept 202s and run for up to
//   15 minutes, but the v2 ESM-style export pattern wasn't being reliably
//   picked up as a background invocation — the function never wrote the
//   report back to Supabase, and the client polled until it timed out.
//
//   The pragmatic fix is to stay synchronous and just keep the work inside
//   the Pro plan's 26-second budget:
//     - Sonnet 4.5 output rate ≈ 60-80 tokens/sec
//     - max_tokens=1200 → ~15-20s of generation
//     - Plus ~2-3s prompt processing
//     - Total ~17-22s — comfortably inside 26s
//
//   The system prompt is correspondingly tightened to ~600-700 words across
//   the 7 sections (~85-100 words per section, one paragraph each).

export const config = {
  path: "/api/generate-report",
  timeout: 26,
};

const SYSTEM_PROMPT_BASE = `You are the Inner Compass report writer.

You MUST write ALL 7 sections completely. Each section gets exactly ONE paragraph of 3-4 sentences. Total target: 700-800 words. Never stop before completing the Closing section. This is a hard requirement.

Sections (write them in this exact order, with ## prefix):
## Who You Become Under Pressure
## The Pressure Signature
## The Inner Driver
## The Behavioral Pattern
## What This Costs You
## The Hidden Strength
## Closing

Tone: second person ("you"), warm but direct, no clinical or therapy language. Write in flowing prose — no bullet points, no lists, no numbered items.

Be specific and personal — name the actual signature, driver, and pattern from the scoring data provided. Never use generic placeholders.`;

const ARABIC_INSTRUCTION = `

LANGUAGE: ARABIC. Write the entire report in natural Modern Standard Arabic — never literal translation, never English mid-sentence.

You MUST write ALL 7 sections completely. Each section gets exactly ONE paragraph of 3-4 sentences. Total target: 700-800 words. Never stop before completing the "خلاصة" section. This is a hard requirement.

Sections (use these EXACT headers, in this exact order, each prefixed with "## "):
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
// 3000 tokens is well above the 700-800 word target (~1100 tokens). The
// generous cap exists so the model never truncates mid-section. The prompt
// itself enforces the word target — Sonnet 4.5 follows the explicit "ALL 7
// sections / 3-4 sentences each" mandate and stops naturally well before
// hitting the cap. Expected wall-clock: ~16-22s at ~70 output tokens/sec.
const MAX_TOKENS = 3000;

interface RequestBody {
  session_id?: unknown;
  scoring_json?: unknown;
  language?: unknown;
}

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });

export default async (req: Request): Promise<Response> => {
  // Diagnostic ping at the top so we can confirm the function is wired up
  // by checking Netlify's function logs. Visible in:
  //   Netlify dashboard → Functions → generate-report → Logs
  // eslint-disable-next-line no-console
  console.log(
    "[generate-report] invoked",
    JSON.stringify({
      method: req.method,
      ts: new Date().toISOString(),
    })
  );

  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // eslint-disable-next-line no-console
    console.error("[generate-report] ANTHROPIC_API_KEY not set on this deploy");
    return json(
      { error: "missing_api_key", detail: "ANTHROPIC_API_KEY env var not set." },
      500
    );
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  if (typeof body.session_id !== "string" || body.session_id.length === 0) {
    return json({ error: "missing_session_id" }, 400);
  }
  if (!body.scoring_json || typeof body.scoring_json !== "object") {
    return json({ error: "missing_scoring_json" }, 400);
  }
  const language: "en" | "ar" = body.language === "ar" ? "ar" : "en";

  // eslint-disable-next-line no-console
  console.log(
    "[generate-report] processing",
    JSON.stringify({ session_id: body.session_id, language })
  );

  const system =
    language === "ar" ? SYSTEM_PROMPT_BASE + ARABIC_INSTRUCTION : SYSTEM_PROMPT_BASE;

  const userMessage =
    language === "ar"
      ? `بيانات التحليل لهذه الجلسة:\n\n\`\`\`json\n${JSON.stringify(body.scoring_json, null, 2)}\n\`\`\`\n\nاكتب التقرير الكامل بجميع الأقسام السبعة. لا تتوقف قبل إكمال قسم "## خلاصة". 700-800 كلمة إجمالًا، فقرة واحدة من 3-4 جمل لكل قسم.`
      : `Here is the scoring data for this session:\n\n\`\`\`json\n${JSON.stringify(body.scoring_json, null, 2)}\n\`\`\`\n\nWrite the complete report with all 7 sections. Do not stop before completing the "## Closing" section. 700-800 words total, one paragraph (3-4 sentences) per section.`;

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
    const detail = e instanceof Error ? e.message : String(e);
    // eslint-disable-next-line no-console
    console.error("[generate-report] fetch threw:", detail);
    return json({ error: "api_fetch_failed", detail }, 502);
  }

  const apiElapsedMs = Date.now() - startMs;

  if (!apiResponse.ok) {
    const text = await apiResponse.text().catch(() => "");
    // eslint-disable-next-line no-console
    console.error(
      "[generate-report] anthropic non-ok",
      JSON.stringify({
        status: apiResponse.status,
        elapsedMs: apiElapsedMs,
        body: text.slice(0, 400),
      })
    );
    return json(
      { error: "api_error", status: apiResponse.status, detail: text.slice(0, 500) },
      502
    );
  }

  let apiBody: {
    content?: Array<{ type?: string; text?: string }>;
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  try {
    apiBody = await apiResponse.json();
  } catch {
    return json({ error: "api_response_not_json" }, 502);
  }

  const reportText =
    apiBody.content
      ?.filter((b) => b?.type === "text" && typeof b.text === "string")
      .map((b) => b.text as string)
      .join("\n\n")
      .trim() ?? "";

  if (!reportText) {
    return json(
      { error: "empty_response", detail: "Claude returned no text content." },
      502
    );
  }

  const word_count = reportText
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  // eslint-disable-next-line no-console
  console.log(
    "[generate-report] done",
    JSON.stringify({
      elapsedMs: apiElapsedMs,
      word_count,
      input_tokens: apiBody.usage?.input_tokens,
      output_tokens: apiBody.usage?.output_tokens,
    })
  );

  return json({
    report_text: reportText,
    word_count,
    language,
    generated_at: new Date().toISOString(),
    model: MODEL_ID,
  });
};
