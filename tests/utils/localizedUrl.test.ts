import { describe, expect, it, vi } from "vitest";
import { useLang } from "@/utils/utils";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    locale: {
      value: "en",
    },
  }),
}));

vi.mock("@/router", () => ({
  default: {
    push: vi.fn(),
  },
}));

describe("localizedUrl", () => {
  it("日本語のみ方針のためURLに言語prefixを付けない", () => {
    const { localizedUrl } = useLang();

    expect(localizedUrl("/notes")).toBe("/notes");
  });
});
