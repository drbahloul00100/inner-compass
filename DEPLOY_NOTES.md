# Deploy notes — Inner Compass

## Netlify environment variables (Phase 2)

The following environment variables **must** be set in the Netlify dashboard
(Site settings → Environment variables) before the next production deploy.
Without them, the build will succeed but the Supabase client will throw on
first use at runtime.

| Variable | Value | Scope |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://bvctshqpfnedauytyzfo.supabase.co` | All deploy contexts |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | _(anon key — same value as the local `.env.local`)_ | All deploy contexts |

The anon key is safe to expose to the browser; RLS policies on every Supabase
table restrict reads/writes to the row's owning user.

`SUPABASE_SERVICE_ROLE_KEY` is **not** required in Phase 2. Reserve it for
later phases that need elevated server-side writes (e.g. the scoring job).
Never set it as `NEXT_PUBLIC_*` — that would expose it to the browser.

## Local development

The same two values are kept in `.env.local` at the repo root. That file is
gitignored (`.gitignore` line 14: `.env*.local`) and must never be committed.

## Supabase project setup

Before the first deploy after this commit:

1. Open the Supabase project (`bvctshqpfnedauytyzfo`).
2. Open the SQL editor and run the contents of `supabase/schema.sql`.
   The script is idempotent — re-running it is safe.
3. Under **Authentication → URL Configuration**, add the production URL
   (`https://<netlify-site>.netlify.app/auth/callback`) and the local URL
   (`http://localhost:3000/auth/callback`) to the redirect-URL allow list.

## What's stored in Supabase

- `profiles` — one row per signed-in user, linked to `auth.users`
- `assessment_sessions` — one row per completed assessment, with language
- `responses` — one row per question answer, **excluding item #32**

Item #32 (free-text engagement check) is intentionally never sent to
Supabase. The sync helper at `src/lib/supabase/sync.ts` filters it out.

## What's still in localStorage

Phase 2 keeps localStorage as the primary in-flight store while a session is
in progress. Supabase becomes the durable home only after the user
authenticates from `/finalize`. This means:

- Sessions taken anonymously and abandoned stay only in localStorage.
- A user can finish an assessment without internet and still authenticate
  later — the local responses are pushed to Supabase at that point.
- `pending_session_id` is the localStorage key that bridges the magic-link
  round trip. It is cleared by `/auth/callback` once the session syncs.
