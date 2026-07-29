import { computed, ref } from "vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import HeaderMenu from "@/components/HeaderMenu.vue";

const signedIn = ref(false);

vi.mock("@/utils/utils", () => ({
  useIsSignedIn: () => computed(() => signedIn.value),
  useLang: () => ({
    localizedUrl: (path: string) => path,
  }),
}));

describe("HeaderMenu", () => {
  const mountMenu = () =>
    mount(HeaderMenu, {
      global: {
        stubs: {
          RouterLink: {
            props: ["to"],
            template: "<a :href='to'><slot /></a>",
          },
        },
      },
    });

  it("未ログイン時はHOME、新規登録、ログインを表示する", () => {
    signedIn.value = false;
    const wrapper = mountMenu();

    expect(wrapper.text()).toContain("HOME");
    expect(wrapper.text()).toContain("新規登録");
    expect(wrapper.text()).toContain("ログイン");
    expect(wrapper.text()).not.toContain("マイノート");
  });

  it("ログイン済み時はHOME、マイノート、使い方を表示する", () => {
    signedIn.value = true;
    const wrapper = mountMenu();

    expect(wrapper.text()).toContain("HOME");
    expect(wrapper.text()).toContain("マイノート");
    expect(wrapper.text()).toContain("使い方");
    expect(wrapper.text()).not.toContain("新規登録");
  });
});

