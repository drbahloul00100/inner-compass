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
// localStorage remains the source of truth in Phase 2. This sync is durability
// + cross-device access; failures here do not break the assessment flow, and
// callers (auth/callback) should preserve pending_session_id on failure so
// the user can retry.
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
    return {
      ok: false,
      error: "not_authenticated",
      responsesSynced: 0,
      responsesSkipped: 0,
    };
  }

  const local = getSession(sessionId);
  if (!local) {
    return {
      ok: false,
      error: "no_local_session",
      responsesSynced: 0,
      responsesSkipped: 0,
    };
  }

  // 1. Defensive profile upsert. The handle_new_user() trigger normally
  // creates a profile row when auth.users gets a new row, but if that ever
  // fails to fire (race, trigger error, pre-existing users), assessment_
  // sessions inserts fail with a FK violation. Upserting here is idempotent
  // and protects against that class of bug. Requires the "Users can insert
  // own profile" RLS policy added in the 2025-phase-2-1-sync-fix migration.
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email,
        language_preference: lang,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

  if (profileError) {
    return {
      ok: false,
      error: `profile_upsert: ${profileError.message}`,
      responsesSynced: 0,
      responsesSkipped: 0,
    };
  }

  // 2. Resolve completed_at idempotently. If the session row already exists
  // with a completed_at, preserve it; otherwise stamp now() when marking
  // completed. (We can't just rely on upsert preserving omitted columns,
  // because we DO want completed_at set on the first completion sync.)
  let completedAt: string | undefined;
  if (options.markCompleted) {
    const { data: existing } = await supabase
      .from("assessment_sessions")
      .select("completed_at")
      .eq("id", sessionId)
      .maybeSingle();
    completedAt = existing?.completed_at ?? new Date().toISOString();
  }

  // 3. Upsert the session row (use the local UUID as the Supabase row id).
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

  // 4. Upsert all responses except item #32 (free-text engagement-validity).
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
