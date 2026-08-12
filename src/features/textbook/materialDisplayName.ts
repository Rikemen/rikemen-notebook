export const MAX_MATERIAL_DISPLAY_NAME_LENGTH = 120;

export type MaterialDisplayNameValidation =
  | { displayName: string; ok: true }
  | { message: string; ok: false };

// These characters cannot be represented safely in a one-line material name.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/u;

export const validateMaterialDisplayName = (value: string): MaterialDisplayNameValidation => {
  const displayName = value.trim();
  if (!displayName) {
    return { message: "資料名を入力してください。", ok: false };
  }
  if (displayName.length > MAX_MATERIAL_DISPLAY_NAME_LENGTH) {
    return { message: `資料名は${MAX_MATERIAL_DISPLAY_NAME_LENGTH}文字以内で入力してください。`, ok: false };
  }
  if (CONTROL_CHARACTER_PATTERN.test(displayName)) {
    return { message: "資料名に改行や制御文字は使用できません。", ok: false };
  }
  return { displayName, ok: true };
};
