import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import CreateNoteForm from "@/components/notes/CreateNoteForm.vue";

describe("CreateNoteForm", () => {
  it("DESIGN.md準拠の作成フォーム構造を持つ", () => {
    const wrapper = mount(CreateNoteForm);

    expect(wrapper.classes()).toContain("create-note-form");
    expect(wrapper.get("button").text()).toBe("ノートを作成");
  });

  it("タイトルとタグだけで作成できる", async () => {
    const wrapper = mount(CreateNoteForm);

    await wrapper.get("[data-testid='note-title']").setValue("HOME作成ノート");
    await wrapper.get("[data-testid='note-tags']").setValue("整数, 証明");
    await wrapper.get("form").trigger("submit");

    expect(wrapper.find("[data-testid='note-subject']").exists()).toBe(false);
    expect(wrapper.emitted("create")?.[0]).toEqual([
      {
        tags: ["整数", "証明"],
        title: "HOME作成ノート",
      },
    ]);
  });
});
