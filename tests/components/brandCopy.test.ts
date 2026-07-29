import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import HomeUsageGuide from "@/components/home/HomeUsageGuide.vue";
import WorkspaceHeader from "@/components/workspace/WorkspaceHeader.vue";
import SignUpPage from "@/views/SignUp.vue";

vi.mock("@/utils/utils", () => ({
  useLocalizedRoute: () => vi.fn(),
}));

vi.mock("@/features/auth/googleAuth", () => ({
  signInWithGoogle: vi.fn(),
}));

describe("brandCopy", () => {
  it("主要画面のアプリ名をGauss Notebookに揃える", () => {
    const home = mount(HomeUsageGuide, {
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    });
    const header = mount(WorkspaceHeader, {
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    });
    const signup = mount(SignUpPage, {
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    });

    expect(`${home.text()} ${header.text()} ${signup.text()}`).toContain("Gauss Notebook");
    expect(`${home.text()} ${header.text()} ${signup.text()}`).not.toContain("Firebase Vue3 kit");
    expect(`${home.text()} ${header.text()} ${signup.text()}`).not.toContain("数学まとめノート");
  });
});
