import { createPinia } from "pinia";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AppLayout from "@/components/Layout.vue";
import { useWorkspaceStore } from "@/features/workspace/workspaceStore";

const route = vi.hoisted(() => ({
  meta: {} as Record<string, unknown>,
  params: {} as Record<string, string>,
}));

vi.mock("vue-router", async () => {
  const actual = await vi.importActual<typeof import("vue-router")>("vue-router");

  return {
    ...actual,
    useRoute: () => route,
  };
});

vi.mock("@/utils/firebase", () => ({
  auth: {
    onAuthStateChanged: vi.fn(),
  },
  functions: {},
}));

vi.mock("@/i18n/utils", () => ({
  useI18nParam: vi.fn(),
}));

describe("LayoutHeader", () => {
  beforeEach(() => {
    route.meta = {};
    route.params = {};
  });

  const mountLayout = (pinia = createPinia()) =>
    mount(AppLayout, {
      global: {
        plugins: [pinia],
        stubs: {
          HeaderMenu: {
            template: "<nav>HOME</nav>",
          },
          MenuList: {
            template: "<aside>menu</aside>",
          },
          RouterLink: {
            props: ["to"],
            template: "<a :href='to'><slot /></a>",
          },
          RouterView: {
            template: "<main />",
          },
        },
      },
    });

  it("白背景と影つきのヘッダーにGauss Notebookロゴを表示する", () => {
    const wrapper = mountLayout();
    const header = wrapper.get("[data-testid='app-header']");

    expect(header.classes()).toContain("app-header");
    expect(wrapper.text()).toContain("Gauss Notebook");
    expect(wrapper.find(".app-header__logo").exists()).toBe(true);
  });

  it("言語切替UIを表示しない", () => {
    const wrapper = mountLayout();

    expect(wrapper.findComponent({ name: "Languages" }).exists()).toBe(false);
  });

  it("ワークスペースのパネル最大化中はアプリ共通ヘッダーを隠す", () => {
    const pinia = createPinia();
    route.meta = {
      workspace: true,
    };
    route.params = {
      noteId: "note-1",
    };
    useWorkspaceStore(pinia).maximizeLayoutPanel("note-1", "whiteboard");

    const wrapper = mountLayout(pinia);

    expect(wrapper.find("[data-testid='app-header']").exists()).toBe(false);
    expect(wrapper.get(".app-router-view").classes()).toContain("app-router-view--workspace-maximized");
  });
});
