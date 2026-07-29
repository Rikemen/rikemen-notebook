export interface MathNote {
  id: string;
  ownerUid: string;
  title: string;
  subject: string;
  tags: string[];
  favorite: boolean;
  recent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteInput {
  title: string;
  subject?: string;
  tags: string[];
}

export interface SearchNotesQuery {
  keyword: string;
  subject: string;
  tag: string;
}
