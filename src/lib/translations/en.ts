import type { Translations } from "@/lib/i18n";

export const en: Translations = {
  nav: {
    logo: "Inner Compass",
    about: "About",
    begin: "Begin",
    dashboard: "Dashboard",
    sign_out: "Sign out",
  },
  footer: {
    copyright: (year) => `© ${year} Inner Compass`,
    tagline: "A self-awareness assessment for thoughtful adults.",
    about: "About",
    privacy: "Privacy",
    terms: "Terms",
  },
  home: {
    hero_heading:
      "A mirror calibrated to show you who you become under pressure — not who you describe yourself as on a calm day.",
    hero_body:
      "Inner Compass is a self-awareness assessment for thoughtful adults. It measures behavior under pressure rather than self-image, and produces a personal report calibrated to the version of you that shows up when your capacity is exceeded.",
    cta_primary: "Begin the assessment",
    cta_secondary: "Read more first",
    why_title: "Why pressure patterns matter",
    why_p1:
      "Most personality systems describe who you are. They miss the more useful question: who you become when capacity is exceeded. The version of you under pressure is the one that makes the costly decisions, has the difficult conversations, and holds the team or the relationship together — or doesn't.",
    why_p2:
      "These patterns are durable. They were forged early and rehearsed daily. They are also legible — once you can see them, you can choose with them in view.",
    // Stats strip
    stats_items_label: "Assessment items",
    stats_signatures_label: "Pressure signatures",
    stats_drivers_label: "Inner drivers",
    stats_domains_label: "Life domains",
    stats_modes_label: "Report modes",
    // 6 reveal cards
    reveals_title: "What Inner Compass reveals",
    reveal1_title: "Pressure Signature",
    reveal1_body:
      "The recurring shape your behavior takes when capacity is exceeded.",
    reveal2_title: "Inner Driver",
    reveal2_body:
      "The deeper hunger — for control, mattering, safety — shaping your choices.",
    reveal3_title: "Decision Architecture",
    reveal3_body:
      "How you weigh stakes, gather information, and commit when data is incomplete.",
    reveal4_title: "Emotional Operating System",
    reveal4_body:
      "How you notice, hold, and express what you feel — and what it costs you to do so.",
    reveal5_title: "Relationship Pattern",
    reveal5_body:
      "How you repair rupture, hold closeness, and move through interpersonal pressure.",
    reveal6_title: "Leadership Footprint",
    reveal6_body:
      "What people around you actually carry from working in your presence.",
    // 4-step flow
    how_title: "How it works",
    flow1_title: "Answer honestly",
    flow1_body:
      "84 behavioral questions, around 15 minutes. From real behavior, not self-image.",
    flow2_title: "Patterns are calculated",
    flow2_body:
      "Your responses are mapped to signatures, drivers, and context modulation.",
    flow3_title: "Lite Report is generated",
    flow3_body:
      "A clear written summary of your primary patterns and what they mean.",
    flow4_title: "Full Report unlocks",
    flow4_body:
      "A deeper, detailed report with development guidance.",
    // Report Preview
    preview_title: "What the report looks like",
    preview_subtitle:
      "Direct, specific, designed to be read once carefully and revisited later.",
    preview_label: "Preview",
    preview_exec_label: "Executive summary",
    preview_exec_body:
      "[Example] Under pressure, you tend toward composed control. Your inner driver leans toward mattering through judgment. The cost shows up in delayed recovery and quiet resentment.",
    preview_glance_label: "At a glance",
    preview_glance_signature_label: "Signature",
    preview_glance_signature: "The Composed Controller",
    preview_glance_driver_label: "Driver",
    preview_glance_driver: "Hunger to matter",
    preview_glance_recovery_label: "Recovery",
    preview_glance_recovery: "Slow",
    preview_signature_label: "Primary pressure signature",
    preview_signature_body:
      "Composed Controller — strong on outward steadiness, costly in private recovery.",
    preview_bar1_label: "Controller",
    preview_bar2_label: "Hunger to matter",
    preview_bar3_label: "Quiet recovery",
    preview_devplan_label: "Development plan",
    preview_devplan_body:
      "Three targeted shifts to soften the pattern without losing its strengths.",
    // Early readers
    early_title: "Early reader reactions",
    early_subtitle:
      "Feedback from early readers will appear here as the beta opens.",
    early_placeholder_label: "Placeholder",
    early_placeholder_quote:
      "This space is reserved for real feedback from early readers — quotes, names, and roles will be added once the beta opens.",
    // Final CTA
    final_cta_title: "Ready when you are.",
    final_cta_body:
      "Take the assessment in a moment when you can be honest with yourself. The report waits.",
  },
  about: {
    title: "About Inner Compass",
    p1: "Inner Compass exists for one reason. Most people have a clear sense of who they are on a calm day, in a familiar context, with their capacity intact. Far fewer have an honest map of who they become when their capacity is exceeded — under pressure, fatigue, real stakes, or interpersonal difficulty.",
    p2: "That second version of you is the one that costs you most. Decisions made there shape careers and relationships. Behaviors patterned there compound silently. The version of you under pressure is a real version, and it is the one Inner Compass is designed to surface.",
    how_title: "How it works",
    how_p1:
      "The assessment is 84 questions. Most are behavioral — they ask what you would actually do in a specific situation, not how you see yourself. A few are calibration questions designed to help the system recognize when answers may be coming from self-image rather than self-observation.",
    how_p2:
      "Once you complete the assessment, your responses are scored against a model of pressure signatures and inner drivers, then translated into a written report.",
    who_title: "Who it's for",
    who_p1:
      "Inner Compass is built for thoughtful adults — leaders, professionals, people in serious work or serious relationships — who suspect there is more to know about themselves than the polished version they normally present.",
    not_title: "What it is not",
    not_p1:
      "Inner Compass is not a clinical instrument. It does not diagnose, classify, or pathologize. It is a tool for self-awareness — for thoughtful adults who want a more honest map of themselves than most assessments provide.",
    privacy_title: "Privacy",
    privacy_p1:
      "Your responses are private. They are not sold, not shared, and not used to train any external system. The assessment includes one open-text item that is used only to calibrate the interpretation of your other answers; that text never appears in your report.",
    cta: "Begin the assessment",
  },
  start: {
    eyebrow: "Before the assessment",
    title: "Before you begin",
    pill_minutes: "About 15 minutes",
    pill_questions: "84 questions",
    pill_saved: "Auto-saved on this device",
    p1: "The assessment takes about 15 minutes. Some questions ask about specific situations and how you would actually respond. Others ask you to reflect on patterns you have noticed in yourself.",
    p2: "The accuracy of your report depends on the honesty of your answers. Where possible, take the assessment in a moment when you are not rushed — and ideally not on a day when you are performing at your highest. The point of Inner Compass is to see the version of you that appears when your capacity is stretched, and that version is most accessible when you are tired or in a real moment of life rather than at peak.",
    p3: "You can navigate back to change earlier answers. Your progress is saved automatically on this device.",
    disclaimer:
      "Inner Compass is a self-awareness tool. It is not a clinical assessment, and it does not diagnose any condition. By continuing, you confirm you are taking it for personal reflection.",
    cta: "Begin",
  },
  finalize: {
    title: "Receive your report",
    subtitle:
      "Enter your email and we'll send you a sign-in link. Once signed in, your assessment will be securely linked to your account. Your responses are private; we will not send marketing.",
    email_label: "Email",
    email_placeholder: "you@example.com",
    submit: "Send sign-in link",
    submitting: "Sending…",
    no_session:
      "No assessment session detected. Please start the assessment first.",
    sent_title: "Check your email",
    sent_body: (email) =>
      `We sent a sign-in link to ${email}. Click the link to access your assessment results.`,
    sent_resend: "Send again",
    sent_back: "Use a different email",
    error_generic: "Could not send sign-in link. Please try again.",
    done_title: "You have completed the assessment.",
    done_p1:
      "Your responses have been saved. Once signed in, you can return to this assessment from your dashboard. Thank you for taking it.",
    done_p2:
      "Report generation will be available in the next phase.",
  },
  login: {
    title: "Sign in",
    subtitle: "Enter your email to receive a sign-in link.",
    email_label: "Email",
    email_placeholder: "you@example.com",
    submit: "Send sign-in link",
    submitting: "Sending…",
    sent_title: "Check your email",
    sent_body: (email) =>
      `We sent a sign-in link to ${email}. Click the link to sign in.`,
    error_generic: "Could not send sign-in link. Please try again.",
  },
  dashboard: {
    title: "Your assessments",
    signed_in_as: "Signed in as",
    sign_out: "Sign out",
    loading: "Loading…",
    no_sessions_title: "No assessments yet",
    no_sessions_body:
      "You haven't started an assessment yet. Begin one now — it takes about 15 minutes.",
    start_new: "Start a new assessment",
    session_started_label: "Started",
    session_status_label: "Status",
    session_responses_label: "Responses",
    session_language_label: "Language",
    status_started: "Started",
    status_in_progress: "In progress",
    status_completed: "Completed",
  },
  preparing: {
    title: "Preparing your results…",
    subtitle: "Just a moment.",
    error_title: "We couldn't generate your scoring.",
    error_body: "Your responses are safe on this device. You can try again or skip to your dashboard.",
    error_retry: "Try again",
    error_skip: "Skip to dashboard",
    error_no_session: "No assessment responses found on this device for that session.",
  },
  report: {
    title: "Your scoring result",
    subtitle: "A preview of the patterns the engine surfaced from your responses.",
    primary_signature_label: "Primary signature",
    primary_driver_label: "Primary driver",
    primary_pattern_label: "Primary pattern",
    validity_label: "Validity confidence",
    signatures_section_title: "Signatures",
    drivers_section_title: "Drivers",
    patterns_section_title: "Patterns",
    intensity_label: "Intensity",
    regulation_label: "Regulation",
    match_label: "Match",
    placeholder_note:
      "This is a Phase 3 preview. The full written report is generated in Phase 4.",
    loading: "Loading your scoring result…",
    not_found: "No scoring result found for this session yet.",
    back_to_dashboard: "Back to dashboard",
    none: "—",
    generate_section_title: "Your full report",
    generate_intro:
      "Generate a detailed written report based on your scoring. It takes 30–90 seconds and is yours to keep.",
    generate_button: "Generate full report",
    generating: "Writing your report — this usually takes 15–25 seconds…",
    generating_background:
      "Writing your report — this usually takes 15–25 seconds…",
    generate_error:
      "We couldn't generate the report. Please try again in a moment.",
    report_section_title: "Your Inner Compass report",
    report_meta: (words) => `${words.toLocaleString("en-US")} words`,
    copy_button: "Copy report",
    copied: "Copied",
    regenerate_button: "Regenerate",
    print_button: "🖨️ Print / Save as PDF",
  },
  print: {
    title: "Inner Compass — Personal Report",
    print_button: "🖨️ Print / Save as PDF",
    back_to_report: "← Back to report",
    summary_section_title: "Summary",
    signatures_section_title: "All signatures",
    drivers_section_title: "All drivers",
    no_report_yet: "No report has been generated yet for this session.",
    generated_label: "Generated",
    session_label: "Session",
    intensity_label: "Intensity",
    regulation_label: "Regulation",
    loading: "Loading…",
    not_found: "No scoring result found for this session.",
  },
  callback: {
    auth_error_title: "Sign-in link couldn't be verified. Returning to login…",
    sync_error_title: "We couldn't save your assessment yet.",
    sync_error_body:
      "You're signed in, but a network or server issue prevented us from saving your responses. Your answers are still safe on this device. Please try again.",
    sync_retry: "Try again",
    skip_to_dashboard: "Skip to dashboard",
  },
  assessment: {
    loading: "Loading…",
    error: "Something went wrong. Please refresh the page.",
    prev: "← Previous",
    next: "Next →",
    finish: "Finish",
    validation_choose: "Please choose a response before continuing.",
    validation_part_single: (part) =>
      `Part ${part} is unanswered. Please answer both parts to continue.`,
    validation_parts_multiple: (parts) =>
      `Parts ${parts.join(" and ")} are unanswered. Please answer both parts to continue.`,
    validation_incomplete: (count) =>
      `${count} ${
        count === 1 ? "question is" : "questions are"
      } still unanswered. Returning you to the first one.`,
  },
  progress: {
    label: (current, total) => `Question ${current} of ${total}`,
  },
  two_part: {
    part_label: (index, total) => `Part ${index} of ${total}`,
  },
  free_text: {
    placeholder: "Take your time.",
    help: "One or two honest sentences is enough. This will not appear in your report.",
    char_count: (count, max) => `${count} / ${max} characters`,
  },
};
