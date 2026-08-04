import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import MaterialModeSwitcher from "@/components/textbook/MaterialModeSwitcher.vue";

describe("MaterialModeSwitcher", () => {
  it("3モードをアイコンボタンで切り替える", async () => {
    const wrapper = mount(MaterialModeSwitcher, {
      props: {
        modelValue: "materials",
      },
    });
    const buttons = wrapper.findAll("button");

    expect(buttons).toHaveLength(3);
    expect(buttons.map((button) => button.attributes("aria-label"))).toEqual(["資料一覧", "目次", "プレビュー"]);
    expect(buttons[0].attributes("aria-pressed")).toBe("true");
    expect(buttons[1].attributes("title")).toBe("目次");

    await buttons[1].trigger("click");

    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["contents"]);
  });

  it("教材がないときは目次とプレビューを無効にする", async () => {
    const wrapper = mount(MaterialModeSwitcher, {
      props: {
        disabledModes: ["contents", "preview"],
        modelValue: "materials",
      },
    });
    const buttons = wrapper.findAll("button");

    expect(buttons[1].attributes("disabled")).toBeDefined();
    expect(buttons[2].attributes("disabled")).toBeDefined();
    await buttons[1].trigger("click");

    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });
});
