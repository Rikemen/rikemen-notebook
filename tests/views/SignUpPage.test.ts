import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import SignUpPage from "@/views/SignUp.vue";

const mocks = vi.hoisted(() => ({
  routePush: vi.fn(),
  signInWithGoogle: vi.fn(),
}));

vi.mock("@/utils/utils", () => ({
  useLocalizedRoute: () => mocks.routePush,
}));

vi.mock("@/features/auth/googleAuth", () => ({
  signInWithGoogle: () => mocks.signInWithGoogle(),
}));

describe("SignUpPage", () => {
  it("Google新規登録を実行し、成功時にHOMEへ移動する", async () => {
    mocks.signInWithGoogle.mockResolvedValueOnce({ ok: true });
    const wrapper = mount(SignUpPage, {
      global: {
        stubs: {
          RouterLink: {
            props: ["to"],
            template: "<a :href='to'><slot /></a>",
          },
        },
      },
    });

    expect(wrapper.text()).toContain("Googleで新規登録");
    await wrapper.get("button").trigger("click");

    expect(mocks.routePush).toHaveBeenCalledWith("/");
    expect(wrapper.get("a").attributes("href")).toBe("/login");
  });
});
