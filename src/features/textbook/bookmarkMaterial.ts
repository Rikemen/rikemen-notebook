/* eslint-disable max-statements */
export const BOOKMARK_TITLE_MAX_LENGTH = 120;
export const BOOKMARK_URL_MAX_LENGTH = 2048;

export type BookmarkValidationResult = { ok: true; title: string; url: string } | { message: string; ok: false };

export const validateBookmark = (titleInput: string, urlInput: string): BookmarkValidationResult => {
  const title = titleInput.trim();
  const rawUrl = urlInput.trim();
  if (!rawUrl || rawUrl.length > BOOKMARK_URL_MAX_LENGTH) {
    return { message: "URLは2,048文字以内で入力してください。", ok: false };
  }
  if (title.length > BOOKMARK_TITLE_MAX_LENGTH) {
    return { message: "タイトルは120文字以内で入力してください。", ok: false };
  }

  try {
    const parsed = new URL(rawUrl);
    if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) {
      return { message: "httpまたはhttpsのURLを入力してください。", ok: false };
    }
    const normalizedUrl = parsed.toString();
    if (normalizedUrl.length > BOOKMARK_URL_MAX_LENGTH) {
      return { message: "URLは2,048文字以内で入力してください。", ok: false };
    }
    return {
      ok: true,
      title: title || parsed.hostname,
      url: normalizedUrl,
    };
  } catch {
    return { message: "有効なURLを入力してください。", ok: false };
  }
};
