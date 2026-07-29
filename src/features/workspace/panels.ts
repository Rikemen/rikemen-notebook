export type WorkspacePanelId = "textbook" | "whiteboard" | "ai-chat" | "diagram-code";
export type WorkspacePanelVisibility = Record<WorkspacePanelId, boolean>;

export interface WorkspacePanelDefinition {
  icon: string;
  id: WorkspacePanelId;
  title: string;
}

export const workspacePanels: WorkspacePanelDefinition[] = [
  {
    icon: "menu_book",
    id: "textbook",
    title: "資料",
  },
  {
    icon: "edit_note",
    id: "whiteboard",
    title: "ホワイトボード",
  },
  {
    icon: "smart_toy",
    id: "ai-chat",
    title: "AIチャット",
  },
  {
    icon: "code",
    id: "diagram-code",
    title: "スケッチ",
  },
];
