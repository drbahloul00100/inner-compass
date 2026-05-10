import type {
  AssessmentSession,
  UserResponse,
  ResponseAnswer,
} from "@/types/response";

const STORAGE_PREFIX = "inner_compass_session_";
const FREE_TEXT_ITEM_ID = 32;

function isClient(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function storageKey(sessionId: string): string {
  return STORAGE_PREFIX + sessionId;
}

export function getSession(sessionId: string): AssessmentSession | null {
  if (!isClient()) return null;
  try {
    const raw = localStorage.getItem(storageKey(sessionId));
    if (!raw) return null;
    return JSON.parse(raw) as AssessmentSession;
  } catch {
    return null;
  }
}

export function saveSession(session: AssessmentSession): void {
  if (!isClient()) return;
  try {
    localStorage.setItem(
      storageKey(session.session_id),
      JSON.stringify(session)
    );
  } catch {
    // Storage may be full or disabled. Fail silently for now.
  }
}

export function createSession(sessionId: string): AssessmentSession {
  const session: AssessmentSession = {
    session_id: sessionId,
    started_at: new Date().toISOString(),
    responses: {},
    current_item_id: 1,
  };
  saveSession(session);
  return session;
}

export function getOrCreateSession(sessionId: string): AssessmentSession {
  return getSession(sessionId) ?? createSession(sessionId);
}

export function setResponse(
  sessionId: string,
  itemId: number,
  answer: ResponseAnswer
): AssessmentSession | null {
  const session = getSession(sessionId);
  if (!session) return null;

  const response: UserResponse = {
    item_id: itemId,
    answer,
    answered_at: new Date().toISOString(),
  };

  session.responses[itemId] = response;
  saveSession(session);
  return session;
}

export function setCurrentItem(
  sessionId: string,
  itemId: number
): AssessmentSession | null {
  const session = getSession(sessionId);
  if (!session) return null;
  session.current_item_id = itemId;
  saveSession(session);
  return session;
}

export function getResponse(
  sessionId: string,
  itemId: number
): UserResponse | undefined {
  const session = getSession(sessionId);
  return session?.responses[itemId];
}

export function getAnsweredItemIds(sessionId: string): number[] {
  const session = getSession(sessionId);
  if (!session) return [];
  return Object.keys(session.responses).map((id) => parseInt(id, 10));
}

// Returns the array of item IDs that are NOT yet considered complete.
// Item #32 (free_text) is treated as complete as long as a response exists,
// even if the answer is the empty string. This means a user who advances
// past item #32 without typing anything is still considered to have
// completed the assessment.
export function findUnansweredItems(
  sessionId: string,
  allItemIds: number[],
  twoPartItemIds: number[],
  twoPartSubIds: Record<number, string[]>
): number[] {
  const session = getSession(sessionId);
  if (!session) return allItemIds;

  const incomplete: number[] = [];

  for (const id of allItemIds) {
    const response = session.responses[id];

    // Item #32: complete iff any response exists, regardless of answer content.
    if (id === FREE_TEXT_ITEM_ID) {
      if (!response) incomplete.push(id);
      continue;
    }

    // All other items: response must exist AND be non-empty.
    if (!response) {
      incomplete.push(id);
      continue;
    }

    if (twoPartItemIds.includes(id)) {
      const expectedSubIds = twoPartSubIds[id] ?? [];
      const answer = response.answer as Record<string, string>;
      const allFilled = expectedSubIds.every(
        (sid) =>
          typeof answer[sid] === "string" && answer[sid].length > 0
      );
      if (!allFilled) incomplete.push(id);
      continue;
    }

    // Single-answer items: must be a non-empty string.
    if (typeof response.answer !== "string" || response.answer.length === 0) {
      incomplete.push(id);
    }
  }

  return incomplete;
}

export function clearSession(sessionId: string): void {
  if (!isClient()) return;
  localStorage.removeItem(storageKey(sessionId));
}
