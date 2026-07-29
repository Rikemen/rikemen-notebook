export type AutosaveState = "idle" | "dirty" | "saving" | "saved" | "failed";

export interface AutosaveStatus {
  state: AutosaveState;
  savedAt: string | null;
  errorMessage: string;
}

export const createAutosaveStatus = (): AutosaveStatus => ({
  errorMessage: "",
  savedAt: null,
  state: "idle",
});

export const autosaveStatusLabel = (status: AutosaveStatus) => {
  switch (status.state) {
    case "dirty":
      return "未保存の変更があります";
    case "saving":
      return "保存中";
    case "saved":
      if (status.savedAt) {
        return `保存済み ${status.savedAt}`;
      }

      return "保存済み";
    case "failed":
      return status.errorMessage || "保存に失敗しました";
    case "idle":
    default:
      return "変更はありません";
  }
};
