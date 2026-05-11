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

// Pushes a local assessment session and its responses to Supabase under the
// currently authenticated user. Idempotent — re-runnable without duplicating
// rows (uses upsert with the local session UUID as the row id, and the
// (session_id, item_id) unique constraint on responses).
//
// localStorage is the source of truth in Phase 2. This sync is best-effort
// durability; failures here do not break the assessment flow.
export async function syncSessionToSupabase(
  sessionId: string,
  lang: Language,
  options: { markCompleted?: boolean } = {}
): Promise<SyncResult> {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: "not_authenticated", responsesSynced: 0, responsesSkipped: 0 };
  }

  const local = getSession(sessionId);
  if (!local) {
    return { ok: false, error: "no_local_session", responsesSynced: 0, responsesSkipped: 0 };
  }

  // 1. Upsert the session row (use the local UUID as the Supabase row id).
  const sessionRow = {
    id: sessionId,
    user_id: user.id,
    language: lang,
    started_at: local.started_at,
    status: options.markCompleted ? "completed" : "in_progress",
    ...(options.markCompleted ? { completed_at: new Date().toISOString() } : {}),
  };

  const { error: sessionError } = await supabase
    .from("assessment_sessions")
    .upsert(sessionRow, { onConflict: "id" });

  if (sessionError) {
    return {
      ok: false,
      error: `session_upsert: ${sessionError.message}`,
      responsesSynced: 0,
      responsesSkipped: 0,
    };
  }

  // 2. Upsert all responses except item #32.
  const allResponses = Object.values(local.responses);
  const filteredResponses = allResponses.filter(
    (r) => r.item_id !== ITEM_ID_FREE_TEXT
  );
  const skipped = allResponses.length - filteredResponses.length;

  if (filteredResponses.length === 0) {
    return { ok: true, responsesSynced: 0, responsesSkipped: skipped };
  }

  const rows = filteredResponses.map((r) => ({
    session_id: sessionId,
    item_id: r.item_id,
    answer: r.answer,
    answered_at: r.answered_at,
  }));

  const { error: responsesError } = await supabase
    .from("responses")
    .upsert(rows, { onConflict: "session_id,item_id" });

  if (responsesError) {
    return {
      ok: false,
      error: `responses_upsert: ${responsesError.message}`,
      responsesSynced: 0,
      responsesSkipped: skipped,
    };
  }

  return { ok: true, responsesSynced: filteredResponses.length, responsesSkipped: skipped };
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
