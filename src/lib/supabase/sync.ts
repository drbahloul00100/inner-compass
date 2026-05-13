import { createClient } from "./client";
import { getSession } from "@/lib/storage";
import type { Language } from "@/lib/i18n";

// Item ID 32 is the free-text engagement-validity item. The user explicitly
// asked us never to send its content to Supabase. We skip it on every sync.
const ITEM_ID_FREE_TEXT = 32;

interface SyncResult {
  ok: boolean;
  error?: string;
  responsesSynced: number;
  responsesSkipped: number;
}

// Logger that mirrors to both console and a localStorage debug bucket so the
// user can copy/paste it back to us if console isn't accessible (e.g. mobile).
// The bucket is capped at 200 lines and only used in this sync path.
const DEBUG_KEY = "__inner_compass_sync_debug";
function log(...args: unknown[]) {
  // Browser console
  // eslint-disable-next-line no-console
  console.log("[SYNC]", ...args);

  // Persist to localStorage for post-mortem inspection
  try {
    if (typeof window === "undefined") return;
    const prev = window.localStorage.getItem(DEBUG_KEY) ?? "";
    const line = `${new Date().toISOString()} ${args
      .map((a) =>
        typeof a === "string" ? a : safeStringify(a)
      )
      .join(" ")}`;
    const lines = (prev ? prev.split("\n") : []).concat(line).slice(-200);
    window.localStorage.setItem(DEBUG_KEY, lines.join("\n"));
  } catch {
    // ignore — debug only
  }
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

// Pushes a local assessment session and its responses to Supabase under the
// currently authenticated user. Idempotent — re-runnable without duplicating
// rows (uses upsert with the local session UUID as the row id, and the
// (session_id, item_id) unique constraint on responses).
//
// Logs every step with [SYNC] prefix to console and to localStorage key
// "__inner_compass_sync_debug" for post-mortem inspection.
export async function syncSessionToSupabase(
  sessionId: string,
  lang: Language,
  options: { markCompleted?: boolean } = {}
): Promise<SyncResult> {
  log("start", { sessionId, lang, markCompleted: !!options.markCompleted });

  const supabase = createClient();

  // ---- 1. Auth check
  log("auth.getUser()…");
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    log("FAIL auth.getUser error:", userError);
    return {
      ok: false,
      error: `auth_get_user: ${userError.message}`,
      responsesSynced: 0,
      responsesSkipped: 0,
    };
  }
  if (!user) {
    log("FAIL not_authenticated (no user)");
    return {
      ok: false,
      error: "not_authenticated",
      responsesSynced: 0,
      responsesSkipped: 0,
    };
  }
  log("user resolved:", { id: user.id, email: user.email });

  // ---- 2. Local session lookup
  const local = getSession(sessionId);
  if (!local) {
    log("FAIL no_local_session — localStorage has no session for id", sessionId);
    return {
      ok: false,
      error: "no_local_session",
      responsesSynced: 0,
      responsesSkipped: 0,
    };
  }
  log("local session found:", {
    started_at: local.started_at,
    responses: Object.keys(local.responses).length,
  });

  // ---- 3. Defensive profile upsert
  log("profiles.upsert…");
  const profileRow = {
    id: user.id,
    email: user.email,
    language_preference: lang,
    updated_at: new Date().toISOString(),
  };
  log("profile row:", profileRow);
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .upsert(profileRow, { onConflict: "id" })
    .select();

  if (profileError) {
    log("FAIL profile_upsert error:", profileError);
    return {
      ok: false,
      error: `profile_upsert: ${profileError.message} (code=${profileError.code ?? "?"})`,
      responsesSynced: 0,
      responsesSkipped: 0,
    };
  }
  log("profile upsert ok, returned:", profileData);

  // ---- 4. Resolve completed_at idempotently
  let completedAt: string | undefined;
  if (options.markCompleted) {
    log("looking up existing completed_at…");
    const { data: existing, error: lookupError } = await supabase
      .from("assessment_sessions")
      .select("completed_at")
      .eq("id", sessionId)
      .maybeSingle();
    if (lookupError) {
      log("completed_at lookup error (non-fatal):", lookupError);
    }
    completedAt = existing?.completed_at ?? new Date().toISOString();
    log("completed_at resolved:", completedAt, "(existing:", existing?.completed_at, ")");
  }

  // ---- 5. Upsert session row
  const sessionRow: Record<string, unknown> = {
    id: sessionId,
    user_id: user.id,
    email_captured: user.email,
    language: lang,
    started_at: local.started_at,
    status: options.markCompleted ? "completed" : "in_progress",
    updated_at: new Date().toISOString(),
  };
  if (completedAt) {
    sessionRow.completed_at = completedAt;
  }
  log("assessment_sessions.upsert with row:", sessionRow);

  const { data: sessionData, error: sessionError } = await supabase
    .from("assessment_sessions")
    .upsert(sessionRow, { onConflict: "id" })
    .select();

  if (sessionError) {
    log("FAIL session_upsert error:", sessionError);
    return {
      ok: false,
      error: `session_upsert: ${sessionError.message} (code=${sessionError.code ?? "?"})`,
      responsesSynced: 0,
      responsesSkipped: 0,
    };
  }
  log("session upsert ok, returned rows:", sessionData);

  // ---- 6. Upsert responses (skip item #32)
  const allResponses = Object.values(local.responses);
  const filteredResponses = allResponses.filter(
    (r) => r.item_id !== ITEM_ID_FREE_TEXT
  );
  const skipped = allResponses.length - filteredResponses.length;
  log("responses: total=", allResponses.length, "filtered=", filteredResponses.length, "skipped(#32)=", skipped);

  if (filteredResponses.length === 0) {
    log("no responses to sync, returning ok");
    return { ok: true, responsesSynced: 0, responsesSkipped: skipped };
  }

  const rows = filteredResponses.map((r) => ({
    session_id: sessionId,
    item_id: r.item_id,
    answer: r.answer,
    answered_at: r.answered_at,
  }));
  log("responses.upsert with", rows.length, "rows. sample:", rows[0]);

  const { data: responsesData, error: responsesError } = await supabase
    .from("responses")
    .upsert(rows, { onConflict: "session_id,item_id" })
    .select();

  if (responsesError) {
    log("FAIL responses_upsert error:", responsesError);
    return {
      ok: false,
      error: `responses_upsert: ${responsesError.message} (code=${responsesError.code ?? "?"})`,
      responsesSynced: 0,
      responsesSkipped: skipped,
    };
  }
  log("responses upsert ok, returned", responsesData?.length ?? 0, "rows");

  log("DONE ok", { responsesSynced: filteredResponses.length, responsesSkipped: skipped });
  return {
    ok: true,
    responsesSynced: filteredResponses.length,
    responsesSkipped: skipped,
  };
}

// Updates only the language column on an assessment session. Used when the
// user toggles language mid-assessment AFTER the session has been pushed.
// Pre-auth sessions have no Supabase row yet — caller should swallow errors.
export async function updateSessionLanguage(
  sessionId: string,
  lang: Language
): Promise<void> {
  const supabase = createClient();
  await supabase
    .from("assessment_sessions")
    .update({ language: lang, updated_at: new Date().toISOString() })
    .eq("id", sessionId);
}
