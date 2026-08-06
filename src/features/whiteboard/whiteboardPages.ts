export interface WhiteboardPage {
  id: string;
  noteId: string;
  title: string;
  markdown: string;
  createdAt: string;
  revision: number;
  updatedAt: string;
}

export interface WhiteboardState {
  selectedPageId: string;
  pages: WhiteboardPage[];
}

export const createInitialWhiteboardState = (noteId: string): WhiteboardState => {
  const timestamp = new Date().toISOString();
  const page: WhiteboardPage = {
    createdAt: timestamp,
    id: "page-1",
    markdown: "# ノート\n\nここにMarkdownで記入できます。",
    noteId,
    revision: 0,
    title: "ページ 1",
    updatedAt: timestamp,
  };

  return {
    pages: [page],
    selectedPageId: page.id,
  };
};

export const addWhiteboardPage = (state: WhiteboardState, noteId: string): WhiteboardState => {
  const nextPageNumber = state.pages.length + 1;
  const timestamp = new Date().toISOString();
  const page: WhiteboardPage = {
    createdAt: timestamp,
    id: `page-${nextPageNumber}`,
    markdown: "",
    noteId,
    revision: 1,
    title: `ページ ${nextPageNumber}`,
    updatedAt: timestamp,
  };

  return {
    pages: [...state.pages, page],
    selectedPageId: page.id,
  };
};

export const selectWhiteboardPage = (state: WhiteboardState, pageId: string): WhiteboardState => {
  if (!state.pages.some((page) => page.id === pageId)) {
    return state;
  }

  return {
    ...state,
    selectedPageId: pageId,
  };
};
