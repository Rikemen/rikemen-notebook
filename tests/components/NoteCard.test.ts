import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import NoteCard from "@/components/notes/NoteCard.vue";
import { initialMathNotes } from "@/features/notes/fixtures";
import type { AuthUser } from "@/features/auth/types";

const user: AuthUser = {
  displayName: null,
  email: "rike@example.com",
  photoURL: null,
  uid: "user-1",
};

describe("NoteCard", () => {
  it("ノート内容を表示する", () => {
    const wrapper = mount(NoteCard, {
      props: {
        currentUser: user,
        note: initialMathNotes[0],
      },
    });

    expect(wrapper.text()).toContain("微分の基礎");
    expect(wrapper.text()).toContain("微積分");
    expect(wrapper.classes()).toContain("note-card");
    expect(wrapper.find(".note-card__primary").text()).toBe("開く");
  });

  it("本人の操作イベントを発火する", async () => {
    const wrapper = mount(NoteCard, {
      props: {
        currentUser: user,
        note: initialMathNotes[0],
      },
    });

    await wrapper.get("[data-testid='duplicate-note']").trigger("click");
    await wrapper.get("[data-testid='delete-note']").trigger("click");
    await wrapper.get("[data-testid='favorite-note']").trigger("click");

    expect(wrapper.emitted("duplicate")?.[0]).toEqual(["calculus-note"]);
    expect(wrapper.emitted("delete")?.[0]).toEqual(["calculus-note"]);
    expect(wrapper.emitted("toggle-favorite")?.[0]).toEqual(["calculus-note"]);
  });

  it("他人のノート操作は無効にする", () => {
    const wrapper = mount(NoteCard, {
      props: {
        currentUser: {
          ...user,
          uid: "other-user",
        },
        note: initialMathNotes[0],
      },
    });

    expect(wrapper.get("[data-testid='duplicate-note']").attributes("disabled")).toBeDefined();
    expect(wrapper.get("[data-testid='delete-note']").attributes("disabled")).toBeDefined();
  });
});
