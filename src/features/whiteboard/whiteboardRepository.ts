import type { AuthUser } from "@/features/auth/types";
import type { WhiteboardDrawing } from "@/features/whiteboard/whiteboardDrawings";
import type { WhiteboardPage } from "@/features/whiteboard/whiteboardPages";

export interface WhiteboardRepository {
  deleteDrawing(uid: string, noteId: string, drawingId: string): Promise<void>;
  listDrawings(uid: string, noteId: string): Promise<WhiteboardDrawing[]>;
  listPages(uid: string, noteId: string): Promise<WhiteboardPage[]>;
  saveDrawing(user: AuthUser, noteId: string, drawing: WhiteboardDrawing): Promise<void>;
  savePage(user: AuthUser, page: WhiteboardPage): Promise<void>;
}

const recordKey = (uid: string, noteId: string, childId: string) => `${uid}:${noteId}:${childId}`;
const clonePage = (page: WhiteboardPage): WhiteboardPage => ({ ...page });
const cloneDrawing = (drawing: WhiteboardDrawing): WhiteboardDrawing => structuredClone(drawing);

export class InMemoryWhiteboardRepository implements WhiteboardRepository {
  private readonly drawings = new Map<string, WhiteboardDrawing>();
  private readonly pages = new Map<string, WhiteboardPage>();

  deleteDrawing(uid: string, noteId: string, drawingId: string) {
    this.drawings.delete(recordKey(uid, noteId, drawingId));
    return Promise.resolve();
  }
  listDrawings(uid: string, noteId: string) {
    return Promise.resolve([...this.drawings.entries()].filter(([key]) => key.startsWith(`${uid}:${noteId}:`)).map(([, drawing]) => cloneDrawing(drawing)));
  }
  listPages(uid: string, noteId: string) {
    return Promise.resolve([...this.pages.entries()].filter(([key]) => key.startsWith(`${uid}:${noteId}:`)).map(([, page]) => clonePage(page)));
  }
  saveDrawing(user: AuthUser, noteId: string, drawing: WhiteboardDrawing) {
    this.drawings.set(recordKey(user.uid, noteId, drawing.id), cloneDrawing(drawing));
    return Promise.resolve();
  }
  savePage(user: AuthUser, page: WhiteboardPage) {
    this.pages.set(recordKey(user.uid, page.noteId, page.id), clonePage(page));
    return Promise.resolve();
  }
}
