// Lightweight session ID generation and retrieval.
// In Phase 1, the session_id is the only "identifier" for an assessment attempt.
// In Phase 2, this will be replaced by a database-issued UUID.

export function generateSessionId(): string {
  // crypto.randomUUID is available in all modern browsers and Node 19+
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older runtimes
  return "ic_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function isValidSessionId(id: string): boolean {
  // UUID v4 format OR our fallback prefix
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const fallbackPattern = /^ic_[a-z0-9]+$/i;
  return uuidPattern.test(id) || fallbackPattern.test(id);
}
