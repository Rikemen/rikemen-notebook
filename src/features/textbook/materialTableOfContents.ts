export interface MaterialTocItem {
  children: MaterialTocItem[];
  id: string;
  page: number;
  title: string;
}

export interface MaterialTocInput {
  page: number;
  title: string;
}

export type MaterialTocValidationResult =
  | {
      item: MaterialTocItem;
      ok: true;
    }
  | {
      message: string;
      ok: false;
    };

export const createMaterialTocItem = (
  input: MaterialTocInput,
  pageCount: number | undefined,
  createId: () => string,
): MaterialTocValidationResult => {
  const title = input.title.trim();

  if (!title) {
    return {
      message: "タイトルを入力してください。",
      ok: false,
    };
  }

  if (!Number.isInteger(input.page) || input.page < 1) {
    return {
      message: "ページ番号は1以上の整数で入力してください。",
      ok: false,
    };
  }

  if (pageCount !== undefined && input.page > pageCount) {
    return {
      message: `ページ番号は${pageCount}以下で入力してください。`,
      ok: false,
    };
  }

  return {
    item: {
      children: [],
      id: createId(),
      page: input.page,
      title,
    },
    ok: true,
  };
};

export const addMaterialTocItem = (
  items: MaterialTocItem[],
  item: MaterialTocItem,
): MaterialTocItem[] => [...items, item];
