import type { CreateNoteInput } from "@/features/notes/types";

export interface NoteInputValidation {
  ok: boolean;
  message: string;
}

export const normalizeTags = (rawTags: string) =>
  rawTags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 20);

export const validateNoteInput = (input: CreateNoteInput): NoteInputValidation => {
  if (!input.title.trim()) {
    return {
      message: "タイトルを入力してください。",
      ok: false,
    };
  }

  if (input.title.trim().length > 120) {
    return {
      message: "タイトルは120文字以内で入力してください。",
      ok: false,
    };
  }

  if ((input.subject ?? "").trim().length > 80) {
    return {
      message: "教科は80文字以内で入力してください。",
      ok: false,
    };
  }

  return {
    message: "",
    ok: true,
  };
};
