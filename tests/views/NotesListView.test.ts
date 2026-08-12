import { createPinia } from "pinia";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import type { User } from "firebase/auth";
import NotesListView from "@/views/NotesListView.vue";
import { useStore } from "@/store/index";

const routerPush = vi.fn();

const getNoteCard = (wrapper: VueWrapper, title: string) => {
  const noteCard = wrapper.findAll(".note-card").find((card) => card.text().includes(title));
  if (!noteCard) {
    throw new Error(`ノートカード「${title}」が見つかりません。`);
  }

  return noteCard;
};

vi.mock("vue-router", async () => {
  const actual = await vi.importActual<typeof import("vue-router")>("vue-router");

  return {
    ...actual,
    useRouter: () => ({
      push: routerPush,
    }),
  };
});

const mountView = (signedIn = true) => {
  const pinia = createPinia();
  const wrapper = mount(NotesListView, {
    global: {
      plugins: [pinia],
      stubs: {
        RouterLink: {
          props: ["to"],
          template: "<a><slot /></a>",
        },
      },
    },
  });
  const store = useStore();
  if (signedIn) {
    store.setUser({
      displayName: "Rike Men",
      email: "rike@example.com",
      photoURL: null,
      uid: "user-1",
    } as User);
  } else {
    store.setUser(null);
  }

  return wrapper;
};

describe("NotesListView", () => {
  it("未ログインではログイン導線を表示する", async () => {
    const wrapper = mountView(false);
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain("保存と履歴にはログインが必要です");
    expect(wrapper.find(".notes-view__auth-card").exists()).toBe(true);
  });

  it("ログイン中ユーザーのノート一覧を表示する", async () => {
    const wrapper = mountView();
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain("微分の基礎");
    expect(wrapper.text()).toContain("行列の計算");
    expect(wrapper.find(".notes-view__search-card").exists()).toBe(true);
    expect(wrapper.find(".notes-view__grid").exists()).toBe(true);
    expect(wrapper.find("[data-testid='search-subject']").exists()).toBe(false);
  });

  it("検索入力で一覧を絞り込む", async () => {
    const wrapper = mountView();
    await wrapper.vm.$nextTick();
    await wrapper.get("[data-testid='note-search']").setValue("行列");

    expect(wrapper.text()).not.toContain("微分の基礎");
    expect(wrapper.text()).toContain("行列の計算");
  });

  it("作成ボタンからモーダルを開いてノートを作成する", async () => {
    const wrapper = mountView();
    await wrapper.vm.$nextTick();
    expect(wrapper.find("[data-testid='note-title']").exists()).toBe(false);
    await wrapper.get("[data-testid='open-create-note']").trigger("click");
    await wrapper.get("[data-testid='note-title']").setValue("確率分布");
    expect(wrapper.find("[data-testid='note-subject']").exists()).toBe(false);
    await wrapper.get("[data-testid='note-tags']").setValue("確率, 分布");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(wrapper.text()).toContain("確率分布");
  });

  it("ノート一覧では確認後に選んだノートだけを削除する", async () => {
    const wrapper = mountView();
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
