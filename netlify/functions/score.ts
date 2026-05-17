// Netlify Function: POST /api/score
//
// Receives a session's responses, runs the scoring engine server-side,
// and returns the full scoring JSON. The raw question bank (which contains
// score_mapping, scoring_metadata, and internal_notes) is bundled into this
// function at build time and NEVER reaches the client.
//
// Item 32 (the free-text engagement-validity item) is filtered out before
// the engine even sees it — defense in depth.

import bank from "../../src/data/question-bank-v1.json";
import { runScoringEngine } from "../../src/lib/scoring/engine";
import type { BankQuestion } from "../../src/lib/scoring/types";

const FREE_TEXT_ITEM_ID = 32;

interface IncomingResponse {
  answer: unknown;
}

interface RequestBody {
  responses?: Record<string, IncomingResponse>;
}

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });

export default async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  if (!body || typeof body !== "object" || !body.responses) {
    return jsonResponse({ error: "missing_responses" }, 400);
  }
  if (typeof body.responses !== "object") {
    return jsonResponse({ error: "responses_not_object" }, 400);
  }

  // Defensively drop item 32 before scoring.
  const filtered: Record<number, { answer: unknown }> = {};
  for (const [key, val] of Object.entries(body.responses)) {
    const id = parseInt(key, 10);
    if (!Number.isFinite(id)) continue;
    if (id === FREE_TEXT_ITEM_ID) continue;
    if (val && typeof val === "object" && "answer" in val) {
      filtered[id] = { answer: (val as IncomingResponse).answer };
    }
  }

  if (Object.keys(filtered).length === 0) {
    return jsonResponse({ error: "no_scorable_responses" }, 400);
  }

  // Type-narrow the bundled JSON so the engine sees the BankQuestion shape.
  const questions = (bank as { questions: unknown[] }).questions as BankQuestion[];

  try {
    const result = runScoringEngine(filtered, questions);
    return jsonResponse(result, 200);
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    // eslint-disable-next-line no-console
    console.error("[score] engine_failed:", detail);
    return jsonResponse({ error: "engine_failed", detail }, 500);
  }
};

// Expose the function at /api/score (Netlify v2 syntax).
export const config = {
  path: "/api/score",
};
