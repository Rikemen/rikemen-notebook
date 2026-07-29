import { existsSync, readFileSync } from "node:fs";
import { createPinia } from "pinia";
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import AppLayout from "@/components/Layout.vue";
import LoginPage from "@/views/Login.vue";

const mocks = vi.hoisted(() => ({
  routePush: vi.fn(),
  signInWithGoogle: vi.fn(),
}));

vi.mock("@/utils/firebase", () => ({
  auth: {
    onAuthStateChanged: vi.fn(),
  },
  functions: {},
}));

vi.mock("@/i18n/utils", () => ({
  useI18nParam: vi.fn(),
}));

vi.mock("vue-router", async () => {
  const actual = await vi.importActual<typeof import("vue-router")>("vue-router");

  return {
    ...actual,
    useRoute: () => ({
      meta: {},
      params: {},
    }),
  };
});

vi.mock("@/utils/utils", () => ({
  useLocalizedRoute: () => mocks.routePush,
}));

vi.mock("@/features/auth/googleAuth", () => ({
  signInWithGoogle: () => mocks.signInWithGoogle(),
}));

describe("gauss-brand-flow", () => {
  it("title/favicon、ヘッダー、ログイン後HOME遷移を確認する", async () => {
    const html = readFileSync("index.html", "utf8");
    const layout = mount(AppLayout, {
      global: {
        plugins: [createPinia()],
        stubs: {
          HeaderMenu: true,
          MenuList: true,
          RouterLink: {
            props: ["to"],
            template: "<a :href='to'><slot /></a>",
          },
          RouterView: true,
        },
      },
    });
    mocks.signInWithGoogle.mockResolvedValueOnce({ ok: true });
    const login = mount(LoginPage, {
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    });

    await login.get("button").trigger("click");

    expect(html).toContain("<title>Gauss Notebook</title>");
    expect(html).toContain('href="/favicon.png"');
    expect(existsSync("public/favicon.png")).toBe(true);
    expect(layout.text()).toContain("Gauss Notebook");
    expect(layout.findComponent({ name: "Languages" }).exists()).toBe(false);
    expect(mocks.routePush).toHaveBeenCalledWith("/");
  });
});
