import type { MathNote, SearchNotesQuery } from "@/features/notes/types";

export const normalizeSearchText = (value: string) => value.trim().normalize("NFKC").toLocaleLowerCase("ja");

const includesNormalized = (value: string, query: string) => normalizeSearchText(value).includes(normalizeSearchText(query));

export const searchNotes = (notes: MathNote[], query: Partial<SearchNotesQuery>) => {
  const keyword = normalizeSearchText(query.keyword ?? "");
  const tag = normalizeSearchText(query.tag ?? "");

  return notes.filter((note) => {
    const matchesKeyword =
      !keyword || includesNormalized(note.title, keyword) || note.tags.some((noteTag) => includesNormalized(noteTag, keyword));
    const matchesTag = !tag || note.tags.some((noteTag) => includesNormalized(noteTag, tag));

    return matchesKeyword && matchesTag;
  });
};
