import type { Translations } from "@/lib/i18n";

export const en: Translations = {
  nav: {
    logo: "Inner Compass",
    about: "About",
    begin: "Begin",
  },
  footer: {
    copyright: (year) => `© ${year} Inner Compass`,
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
    measures_title: "What it measures",
    measures_p1:
      "Most personality assessments tell you who you are on your best day. Inner Compass tells you who you become on your worst.",
    measures_p2:
      "Across 84 carefully written items, it measures your pressure signatures (what tends to appear when you are stretched), your inner drivers (the deeper hungers shaping your choices), and the way these combine into a recognizable pattern.",
    measures_p3:
      "The result is a written report — direct, warm, and specific — designed to be read once carefully and revisited later.",
    expect_title: "What to expect",
    expect_time_label: "Time required:",
    expect_time_body: "about 15 minutes of honest answering.",
    expect_style_label: "Question style:",
    expect_style_body: "behavioral scenarios, not personality preferences.",
    expect_output_label: "Output:",
    expect_output_body: "a personal report you can read in the browser or download.",
    expect_privacy_label: "Privacy:",
    expect_privacy_body:
      "your responses are private to you. They are never sold or shared.",
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
    not_title: "What it is not",
    not_p1:
      "Inner Compass is not a clinical instrument. It does not diagnose, classify, or pathologize. It is a tool for self-awareness — for thoughtful adults who want a more honest map of themselves than most assessments provide.",
    privacy_title: "Privacy",
    privacy_p1:
      "Your responses are private. They are not sold, not shared, and not used to train any external system. The assessment includes one open-text item that is used only to calibrate the interpretation of your other answers; that text never appears in your report.",
    cta: "Begin the assessment",
  },
  start: {
    title: "Before you begin",
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
      "Enter your email to receive your personal Inner Compass report. Your responses are private; we will not send marketing.",
    email_label: "Email",
    email_placeholder: "you@example.com",
    submit: "Continue",
    no_session:
      "No assessment session detected. Please start the assessment first.",
    done_title: "You have completed Phase 1.",
    done_p1:
      "In Phase 2, this is where your account will be created and your report will be generated. For now, your assessment responses have been saved to this browser’s local storage. Thank you for taking the assessment.",
    done_p2:
      "This page is a placeholder for the email-capture and scoring flow that will be built in Phase 2.",
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
