import { createPinia } from "pinia";
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import type { User } from "firebase/auth";
import { ANONYMOUS_UPLOAD_LIMIT_BYTES, SIGNED_IN_DAILY_AI_LIMIT, SIGNED_IN_UPLOAD_LIMIT_BYTES } from "@/features/auth/accessPolicy";
import NotesListView from "@/views/NotesListView.vue";
import WorkspaceView from "@/views/WorkspaceView.vue";
import { useStore } from "@/store/index";

const routerPush = vi.fn();

vi.mock("vue-router", async () => {
  const actual = await vi.importActual<typeof import("vue-router")>("vue-router");

  return {
    ...actual,
    useRoute: () => ({
      params: {
        noteId: "calculus-note",
      },
    }),
    useRouter: () => ({
      push: routerPush,
    }),
  };
});

const signIn = () => {
  const store = useStore();
  store.setUser({
    displayName: "Rike Men",
    email: "rike@example.com",
    photoURL: null,
    uid: "user-1",
  } as User);
};

describe("auth-notes-workspace", () => {
  it("未ログインでは保存履歴導線のみで、ログイン後にノート作成とワークスペース表示ができる", async () => {
    const pinia = createPinia();
    const notesView = mount(NotesListView, {
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: {
            template: "<a><slot /></a>",
          },
        },
      },
    });
    useStore().setUser(null);
    await notesView.vm.$nextTick();

    expect(notesView.text()).toContain("保存と履歴にはログインが必要です");

    signIn();
    await notesView.vm.$nextTick();
    await notesView.get("[data-testid='open-create-note']").trigger("click");
    await notesView.get("[data-testid='note-title']").setValue("結合テストノート");
    await notesView.get("form").trigger("submit");

    expect(notesView.text()).toContain("結合テストノート");

    const workspaceView = mount(WorkspaceView, {
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
    await workspaceView.vm.$nextTick();

    expect(workspaceView.text()).toContain("微分の基礎");
    expect(workspaceView.text()).toContain("資料");
    expect(workspaceView.text()).toContain("AIチャット");
  });

  it("認証状態ごとの上限値を確認する", () => {
    expect(ANONYMOUS_UPLOAD_LIMIT_BYTES).toBe(10 * 1024 * 1024);
    expect(SIGNED_IN_UPLOAD_LIMIT_BYTES).toBe(5 * 1024 * 1024 * 1024);
    expect(SIGNED_IN_DAILY_AI_LIMIT).toBe(100);
  });
});
