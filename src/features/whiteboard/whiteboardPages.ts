export interface WhiteboardPage {
  id: string;
  noteId: string;
  title: string;
  markdown: string;
  createdAt: string;
}

export interface WhiteboardState {
  selectedPageId: string;
  pages: WhiteboardPage[];
}

export const createInitialWhiteboardState = (noteId: string): WhiteboardState => {
  const page: WhiteboardPage = {
    createdAt: new Date().toISOString(),
    id: "page-1",
    markdown: "# ノート\n\nここにMarkdownで記入できます。",
    noteId,
    title: "ページ 1",
  };

  return {
    pages: [page],
    selectedPageId: page.id,
  };
};

export const addWhiteboardPage = (state: WhiteboardState, noteId: string): WhiteboardState => {
  const nextPageNumber = state.pages.length + 1;
  const page: WhiteboardPage = {
    createdAt: new Date().toISOString(),
    id: `page-${nextPageNumber}`,
    markdown: "",
    noteId,
    title: `ページ ${nextPageNumber}`,
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
