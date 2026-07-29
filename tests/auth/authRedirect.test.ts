import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import LoginPage from "@/views/Login.vue";

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

describe("authRedirect", () => {
  it("Google認証成功後はHOMEへ移動する", async () => {
    mocks.signInWithGoogle.mockResolvedValueOnce({ ok: true });
    const wrapper = mount(LoginPage, {
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    });

    await wrapper.get("button").trigger("click");

    expect(mocks.routePush).toHaveBeenCalledWith("/");
  });
});

