import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "@/components/layout/Layout";
import Button from "@/components/ui/Button";
import Section from "@/components/ui/Section";
import { useLanguage } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/supabase/useUser";

interface SessionRow {
  id: string;
  language: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  response_count: number;
}

export default function Dashboard() {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const { user, loading: userLoading } = useUser();

  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [profileName, setProfileName] = useState<string | null>(null);

  // Redirect to login once we know the user is not signed in.
  useEffect(() => {
    if (!userLoading && !user) {
      router.replace("/login");
    }
  }, [userLoading, user, router]);

  // Fetch profile + sessions once we have a user.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const fetchAll = async () => {
      setLoadingSessions(true);
      const supabase = createClient();

      // Best-effort profile name lookup. The `name` column may not exist yet
      // (it's planned for a future migration) — Supabase returns an error if
      // we select a non-existent column, so we swallow it silently.
      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", user.id)
          .maybeSingle();
        if (!cancelled && !profileError && profileData) {
          const maybeName = (profileData as { name?: unknown }).name;
          if (typeof maybeName === "string" && maybeName.trim().length > 0) {
            setProfileName(maybeName.trim());
          }
        }
      } catch {
        // Column may not exist — ignore.
      }

      // Sessions
      const { data: sessionRows, error: sessionError } = await supabase
        .from("assessment_sessions")
        .select("id, language, status, started_at, completed_at")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false });

      if (sessionError || !sessionRows) {
        if (!cancelled) {
          setSessions([]);
          setLoadingSessions(false);
        }
        return;
      }

      // Response counts per session, in parallel.
      const counts = await Promise.all(
        sessionRows.map(async (s) => {
          const { count } = await supabase
            .from("responses")
            .select("id", { count: "exact", head: true })
            .eq("session_id", s.id);
          return { id: s.id, count: count ?? 0 };
        })
      );

      const byId = new Map(counts.map((c) => [c.id, c.count]));
      const enriched: SessionRow[] = sessionRows.map((s) => ({
        ...s,
        response_count: byId.get(s.id) ?? 0,
      }));

      if (!cancelled) {
        setSessions(enriched);
        setLoadingSessions(false);
      }
    };

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
  };

  if (userLoading || !user) {
    return (
      <Layout title="Dashboard">
        <Section spacing="spacious">
          <p className="text-ink-mute">{t.dashboard.loading}</p>
        </Section>
      </Layout>
    );
  }

  const statusLabel = (status: string): string => {
    if (status === "scored") return t.dashboard.status_scored;
    if (status === "completed") return t.dashboard.status_completed;
    if (status === "in_progress") return t.dashboard.status_in_progress;
    return t.dashboard.status_started;
  };

  // Western digits even in Arabic — matches the rest of the app convention.
  const formatDate = (iso: string): string => {
    try {
      return new Date(iso).toLocaleDateString(
        lang === "ar" ? "ar" : "en-US",
        {
          year: "numeric",
          month: "short",
          day: "numeric",
          numberingSystem: "latn",
        }
      );
    } catch {
      return iso;
    }
  };

  return (
    <Layout title="Dashboard">
      <Section spacing="spacious">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-[2rem] md:text-[2.5rem] font-serif tracking-[-0.015em] text-ink mb-2 leading-[1.15]">
              {t.dashboard.title}
            </h1>
            {profileName && (
              <p className="text-base md:text-lg text-ink font-medium mb-1">
                {t.dashboard.welcome_named(profileName)}
              </p>
            )}
            <p className="text-sm text-ink-mute">
              {t.dashboard.signed_in_as}{" "}
              <span className="text-ink">{user.email}</span>
            </p>
          </div>
          <Button variant="ghost" onClick={handleSignOut}>
            {t.dashboard.sign_out}
          </Button>
        </div>

        {loadingSessions ? (
          <p className="text-ink-mute">{t.dashboard.loading}</p>
        ) : sessions && sessions.length > 0 ? (
          <>
            <ul className="space-y-3 mb-10">
              {sessions.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/report/${encodeURIComponent(s.id)}`}
                    className="block border border-line bg-paper-card rounded-md p-5 md:p-6 hover:border-line-strong hover:shadow-card focus-visible:border-accent transition-all duration-200 ease-smooth group"
                  >
                    <dl className="grid grid-cols-2 md:grid-cols-4 gap-y-3 gap-x-6 text-sm">
                      <div>
                        <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-mute mb-1">
                          {t.dashboard.session_started_label}
                        </dt>
                        <dd className="text-ink">{formatDate(s.started_at)}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-mute mb-1">
                          {t.dashboard.session_status_label}
                        </dt>
                        <dd className="text-ink">{statusLabel(s.status)}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-mute mb-1">
                          {t.dashboard.session_responses_label}
                        </dt>
                        <dd className="text-ink tabular-nums">
                          {s.response_count}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-mute mb-1">
                          {t.dashboard.session_language_label}
                        </dt>
                        <dd className="text-ink uppercase tracking-wide">
                          {s.language}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-5 pt-4 border-t border-line flex items-center justify-end">
                      <span className="text-sm font-medium text-accent group-hover:text-accent-deep transition-colors duration-200">
                        {t.dashboard.view_report}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/start">
              <Button size="lg" className="w-full sm:w-auto">
                {t.dashboard.start_new}
              </Button>
            </Link>
          </>
        ) : (
          <div className="border border-line bg-paper-card rounded-md p-8 md:p-10">
            <h2 className="text-xl font-serif text-ink mb-3">
              {t.dashboard.no_sessions_title}
            </h2>
            <p className="text-ink-soft leading-relaxed mb-6 max-w-prose">
              {t.dashboard.no_sessions_body}
            </p>
            <Link href="/start">
              <Button size="lg" className="w-full sm:w-auto">
                {t.dashboard.start_new}
              </Button>
            </Link>
          </div>
        )}
      </Section>
    </Layout>
  );
}
