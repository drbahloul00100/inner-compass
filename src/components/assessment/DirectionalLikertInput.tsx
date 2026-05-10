import type { ScaleLabels } from "@/types/question";
import type { LikertAnswer } from "@/types/response";
import LikertInput from "./LikertInput";

// Directional Likert renders identically to Likert in the UI.
// The semantic difference (positional vs magnitude) lives in the scoring engine.
// We keep them as separate components so future visual differentiation
// (e.g., a slider for directional) is easy to introduce.

interface DirectionalLikertInputProps {
  scaleLabels: ScaleLabels;
  value: LikertAnswer | undefined;
  onChange: (value: LikertAnswer) => void;
  itemId: number;
}

export default function DirectionalLikertInput(
  props: DirectionalLikertInputProps
) {
  return <LikertInput {...props} />;
}
