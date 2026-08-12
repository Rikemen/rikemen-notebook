import { createPinia, setActivePinia } from "pinia";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import type { User } from "firebase/auth";
import HomePage from "@/views/Home.vue";
import { useStore } from "@/store/index";

vi.mock("vue-router", async () => {
  const actual = await vi.importActual<typeof import("vue-router")>("vue-router");

  return {
    ...actual,
    useRouter: () => ({
      push: vi.fn(),
    }),
  };
});

const signedInUser = {
  displayName: "Rike Men",
  email: "rike@example.com",
  photoURL: null,
  uid: "user-1",
} as User;

const getNoteCard = (wrapper: VueWrapper, title: string) => {
  const noteCard = wrapper.findAll(".note-card").find((card) => card.text().includes(title));
  if (!noteCard) {
    throw new Error(`ノートカード「${title}」が見つかりません。`);
  }

  return noteCard;
};

const mountHome = (signedIn = false) => {
  const pinia = createPinia();
  setActivePinia(pinia);
  if (signedIn) {
    useStore().setUser(signedInUser);
  }

  const wrapper = mount(HomePage, {
    global: {
      plugins: [pinia],
      stubs: {
        RouterLink: true,
      },
    },
  });

  return {
    pinia,
    wrapper,
  };
};

describe("HomePage", () => {
  it("未ログイン時は使い方だけを表示する", () => {
    const { wrapper } = mountHome();

    expect(wrapper.text()).toContain("資料");
    expect(wrapper.text()).toContain("ホワイトボード");
    expect(wrapper.text()).toContain("AIチャット");
    expect(wrapper.text()).toContain("スケッチ");
    expect(wrapper.text()).not.toContain("すべてのノート");
  });

  it("ログイン済みはノート一覧と検索を表示する", async () => {
    const { wrapper } = mountHome(true);

    expect(wrapper.text()).toContain("すべてのノート");
    await wrapper.get("[data-testid='home-note-search']").setValue("行列");
    expect(wrapper.text()).toContain("行列の計算");
    expect(wrapper.text()).not.toContain("微分の基礎");
  });

  it("HOMEからタイトルとタグだけで新規ノートを作成する", async () => {
    const { wrapper } = mountHome(true);

    expect(wrapper.find("[data-testid='note-subject']").exists()).toBe(false);
    await wrapper.get(".home-notes-summary__create-button").trigger("click");
    await wrapper.get("[data-testid='note-title']").setValue("複素数の復習");
    await wrapper.get("[data-testid='note-tags']").setValue("複素数, 方程式");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(wrapper.text()).toContain("複素数の復習");
    expect(wrapper.text()).toContain("複素数");
  });

  it("タグで絞り込むと見出しをタグ名のノートに切り替える", async () => {
    const { wrapper } = mountHome(true);
    const matrixTag = wrapper.findAll("[data-testid='home-tag-filter']").find((button) => button.text() === "行列");

    expect(matrixTag).toBeTruthy();
    await matrixTag?.trigger("click");

    expect(wrapper.text()).toContain("行列のノート");
    expect(wrapper.text()).toContain("行列の計算");
    expect(wrapper.text()).not.toContain("微分の基礎");
  });

  it("HOMEでは確認後に選んだノートだけを削除する", async () => {
    const { wrapper } = mountHome(true);
    await flushPromises();
    const calculusCard = getNoteCard(wrapper, "微分の基礎");

    await calculusCard.get("[data-testid='delete-note']").trigger("click");

    expect(wrapper.find("[role='dialog']").exists()).toBe(true);
    expect(wrapper.text()).toContain("微分の基礎");
    expect(wrapper.text()).toContain("行列の計算");

    await wrapper.get("[data-testid='cancel-note-delete']").trigger("click");

    expect(wrapper.find("[role='dialog']").exists()).toBe(false);
    expect(wrapper.text()).toContain("微分の基礎");

    await calculusCard.get("[data-testid='delete-note']").trigger("click");
    await wrapper.get("[data-testid='confirm-note-delete']").trigger("click");
    await flushPromises();

    expect(wrapper.text()).not.toContain("微分の基礎");
    expect(wrapper.text()).toContain("行列の計算");
  });
});
