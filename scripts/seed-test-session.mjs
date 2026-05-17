// Generates a complete 84-item localStorage assessment session for testing
// the magic-link → /auth/callback → sync flow without having to click through
// the assessment by hand.
//
// Run:    node scripts/seed-test-session.mjs
// Output: TWO ways to seed:
//   (a) a self-contained browser console snippet (paste in DevTools)
//   (b) a bookmarklet `javascript:` URL (paste in address bar — bypasses
//       Chrome's "allow pasting" warning that blocks DevTools first-paste)
//
// The session_id is `test-session-<random uuid>` so test data is easy to
// identify and clean up in Supabase later.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BANK_PATH = resolve(
  __dirname,
  "../src/data/question-bank-v1.localized.json"
);
const OUTPUT_PATH = resolve(__dirname, "_seed-snippet.txt");
const BOOKMARKLET_PATH = resolve(__dirname, "_seed-bookmarklet.txt");

const bank = JSON.parse(readFileSync(BANK_PATH, "utf-8"));
if (!Array.isArray(bank.questions)) {
  throw new Error("Source bank malformed: questions is not an array");
}

const sessionId = "test-session-" + randomUUID();
const startedAt = new Date().toISOString();

function pickLikert(id) {
  return String(((id - 1) % 5) + 1);
}

function pickFromOptions(_id, options) {
  return options[0].option_id;
}

const responses = {};
for (const q of bank.questions) {
  let answer;
  switch (q.answer_type) {
    case "likert":
    case "directional_likert":
      answer = pickLikert(q.id);
      break;
    case "multiple_choice":
      answer = pickFromOptions(q.id, q.options);
      break;
    case "two_part_multiple_choice":
      answer = {};
      for (const sp of q.options.sub_prompts) {
        answer[sp.sub_id] = pickFromOptions(q.id, sp.options);
      }
      break;
    case "free_text":
      answer = "Test seed content. Item 32 is intentionally skipped from sync.";
      break;
    default:
      throw new Error(`Unknown answer_type "${q.answer_type}" on item ${q.id}`);
  }
  responses[q.id] = {
    item_id: q.id,
    answer,
    answered_at: startedAt,
  };
}

const session = {
  session_id: sessionId,
  started_at: startedAt,
  responses,
  current_item_id: bank.questions[bank.questions.length - 1].id,
};

// --- Console snippet (Option A) ---
const consoleSnippet = `// === Inner Compass test session seeder ===
// Paste this whole block into DevTools Console on ANY page of the site
// (same origin as your assessment). It seeds a complete 84-item session
// into localStorage and redirects to /finalize.
//
// If Chrome blocks the paste with "Don't paste code…", first type
//   allow pasting
// (then Enter) and paste this block again.
(() => {
  const SESSION_ID = ${JSON.stringify(sessionId)};
  const SESSION = ${JSON.stringify(session)};
  try {
    localStorage.setItem("inner_compass_session_" + SESSION_ID, JSON.stringify(SESSION));
    console.log("[seed] localStorage key:", "inner_compass_session_" + SESSION_ID);
    console.log("[seed] responses:", Object.keys(SESSION.responses).length);
    console.log("[seed] redirecting to /finalize…");
    location.href = "/finalize?session_id=" + SESSION_ID;
  } catch (e) {
    console.error("[seed] failed:", e);
    alert("Seed failed — check DevTools console.");
  }
})();
`;

writeFileSync(OUTPUT_PATH, consoleSnippet, "utf-8");

// --- Bookmarklet (Option B) — single-line, URL-encoded ---
// Bookmarklets bypass the DevTools paste warning because they execute in the
// page context via the address bar, not the console.
const bookmarkletBody = `(()=>{const id=${JSON.stringify(sessionId)};const s=${JSON.stringify(session)};try{localStorage.setItem("inner_compass_session_"+id,JSON.stringify(s));location.href="/finalize?session_id="+id;}catch(e){alert("Seed failed: "+e.message);}})();`;
const bookmarklet = "javascript:" + encodeURIComponent(bookmarkletBody);

writeFileSync(BOOKMARKLET_PATH, bookmarklet, "utf-8");

// --- Console report ---
console.log("─".repeat(72));
console.log("Generated test session");
console.log("─".repeat(72));
console.log("session_id          :", sessionId);
console.log("localStorage key    :", "inner_compass_session_" + sessionId);
console.log("responses           :", Object.keys(responses).length, "(items 1–84)");
console.log("free-text item #32  :", "skipped from Supabase sync by design");
console.log("");
console.log("Console snippet     :", OUTPUT_PATH);
console.log("Bookmarklet URL     :", BOOKMARKLET_PATH);
console.log("");
console.log("─".repeat(72));
console.log("Bookmarklet length  :", bookmarklet.length, "chars");
console.log("─".repeat(72));
