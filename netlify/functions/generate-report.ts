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

const SYSTEM_PROMPT_BASE = `You are the Inner Compass report writer. You write personal self-awareness reports in the second person ("you"), warm but direct tone, no clinical language. You never use bullet points in the narrative. You write in flowing paragraphs. The report is based entirely on the scoring data provided — do not invent or assume anything not in the data.

Report structure (write all sections):
1. Opening (2 paragraphs): Who you become under pressure — name the primary signature directly and describe what it looks like behaviorally
2. The Pressure Signature (3 paragraphs): Deep exploration of the primary signature — when it activates, what it costs, what it protects
3. The Inner Driver (2 paragraphs): The hunger underneath the signature — what it's really about, where it comes from
4. The Pattern (2 paragraphs): How the signature and driver combine into a named pattern — what triggers it, how it plays out
5. The Supporting Cast (2 paragraphs): Secondary signatures and how they interact with the primary
6. What This Costs You (2 paragraphs): Real costs of this profile in work and relationships
7. What This Gives You (1 paragraph): The genuine strengths hidden in this profile
8. The Regulation Picture (2 paragraphs): How well you manage these patterns — based on regulation scores
9. A Note on Validity (1 paragraph): Brief honest note on response confidence level
10. Closing (1 paragraph): Warm, direct close — not motivational, not clinical

Write between 800 and 1000 words total. Keep paragraphs tight. Be specific, use the actual names from the data.`;

const ARABIC_INSTRUCTION = `

IMPORTANT: Write the entire report in Modern Standard Arabic. Use natural, mature, professional Arabic — never literal translation. Keep the same 10-section structure described above. Translate the signature, driver, and pattern names naturally into Arabic where appropriate. Examples: "controller" → "المتحكم", "hunger_for_control" → "الحاجة للسيطرة", "the_fortress" → "القلعة", "the_audit" → "التدقيق". Use Western digits (1, 2, 3...) for any numbers. Do not include the English construct names alongside the Arabic ones.`;

const MODEL_ID = "claude-sonnet-4-5";
// 2000 tokens ≈ 1100-1300 English words at Sonnet 4.5 tokenization. That
// gives the model headroom to land an 800-1000 word report cleanly without
// truncation, while keeping generation time under the 26s function budget.
const MAX_TOKENS = 2000;

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
