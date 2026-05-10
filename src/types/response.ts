// User responses, anchored by item_id.
// Two-part responses are objects keyed by sub_id.

export type LikertAnswer = "1" | "2" | "3" | "4" | "5";
export type MultipleChoiceAnswer = string; // option_id, e.g. "A"
export type TwoPartAnswer = Record<string, string>; // { "12a": "B", "12b": "C" }
export type FreeTextAnswer = string;

export type ResponseAnswer =
  | LikertAnswer
  | MultipleChoiceAnswer
  | TwoPartAnswer
  | FreeTextAnswer;

export interface UserResponse {
  item_id: number;
  answer: ResponseAnswer;
  answered_at: string; // ISO timestamp
}

export interface AssessmentSession {
  session_id: string;
  started_at: string;
  responses: Record<number, UserResponse>; // keyed by item_id for fast lookup
  current_item_id: number; // for resume
}
