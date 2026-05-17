// Netlify Function: POST /api/generate-report
//
// Receives a session's scoring_json and a language preference, calls the
// Anthropic Claude API server-side, and returns the generated report text.
//
// The ANTHROPIC_API_KEY env var must be set on Netlify (and in .env.local
// for local dev). It is NEVER read by the client.
//
// The function does NOT write to Supabase. The frontend persists the
// returned report into scoring_results.report_text after a successful
// call — that way one code path owns caching.

// Config is exported at the top so it's discoverable. Pro plan allows
// synchronous functions to run up to 26 seconds (vs. 10 seconds on the
// free tier) — we use the full budget. `path` exposes the function at
// /api/generate-report.
export const config = {
  path: "/api/generate-report",
  timeout: 26,
};

// Compact 4-paragraph prompt designed to fit comfortably inside the 26s
// Netlify Pro function budget. Earlier 10-section versions ran 25-35s and
// timed out under load.
const SYSTEM_PROMPT_BASE = `You are the Inner Compass report writer. Write a personal self-awareness report in second person, warm but direct tone, no bullet points, flowing paragraphs only. Maximum 500 words total. Write exactly 4 paragraphs:
1. Who you become under pressure (name the primary signature)
2. The inner driver beneath it (name the primary driver)
3. The pattern this creates (name the primary pattern)
4. What this costs you and what it gives you
Be specific, use the actual names from the scoring data. No filler sentences.
For Arabic: write entirely in Arabic with the same structure.`;

// Small Arabic-specific reinforcement so construct names are translated
// naturally instead of left as English snake_case mid-sentence.
const ARABIC_INSTRUCTION = `

Language: Arabic. Use natural Modern Standard Arabic. Translate signature/driver/pattern names: controller→المتحكم, hunger_for_control→الحاجة للسيطرة, the_fortress→القلعة, etc. Use Western digits for any numbers.`;

const MODEL_ID = "claude-sonnet-4-5";
// 800 tokens ≈ 500-600 English words at Sonnet 4.5 tokenization. Matches
// the new 400-500 word prompt target with just enough headroom for clean
// landing, keeping generation time well under the 26s function budget.
const MAX_TOKENS = 800;

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
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // eslint-disable-next-line no-console
    console.error("[generate-report] ANTHROPIC_API_KEY not set");
    return json(
      { error: "missing_api_key", detail: "ANTHROPIC_API_KEY env var not set on the server." },
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

  const system =
    language === "ar" ? SYSTEM_PROMPT_BASE + ARABIC_INSTRUCTION : SYSTEM_PROMPT_BASE;

  const userMessage =
    language === "ar"
      ? `بيانات التحليل لهذه الجلسة:\n\n\`\`\`json\n${JSON.stringify(body.scoring_json, null, 2)}\n\`\`\`\n\nاكتب التقرير الكامل وفق البنية المحددة في النظام.`
      : `Here is the scoring data for this session:\n\n\`\`\`json\n${JSON.stringify(body.scoring_json, null, 2)}\n\`\`\`\n\nWrite the full report following the structure exactly.`;

  // Call Anthropic.
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
    console.error("[generate-report] fetch_failed:", detail);
    return json({ error: "api_fetch_failed", detail }, 502);
  }

  if (!apiResponse.ok) {
    const text = await apiResponse.text().catch(() => "");
    // eslint-disable-next-line no-console
    console.error(
      "[generate-report] api_error status=",
      apiResponse.status,
      "body=",
      text.slice(0, 400)
    );
    return json(
      { error: "api_error", status: apiResponse.status, detail: text.slice(0, 500) },
      502
    );
  }

  let apiBody: {
    content?: Array<{ type?: string; text?: string }>;
    stop_reason?: string;
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

  return json({
    report_text: reportText,
    word_count,
    language,
    generated_at: new Date().toISOString(),
    model: MODEL_ID,
  });
};
