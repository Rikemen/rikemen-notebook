import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import AppButton from "@/components/ui/AppButton.vue";
import AppIconButton from "@/components/ui/AppIconButton.vue";
import AppInput from "@/components/ui/AppInput.vue";
import AppTabs from "@/components/ui/AppTabs.vue";

describe("uiPrimitives", () => {
  it("ボタン種別、アイコンlabel、タブ選択、入力エラーを表現する", () => {
    const button = mount(AppButton, {
      props: {
        variant: "primary",
      },
      slots: {
        default: "保存",
      },
    });
    const iconButton = mount(AppIconButton, {
      props: {
        icon: "undo",
        label: "元に戻す",
      },
    });
    const tabs = mount(AppTabs, {
      props: {
        modelValue: "code",
        tabs: [
          { label: "図表", value: "diagram" },
          { label: "コード", value: "code" },
        ],
      },
    });
    const input = mount(AppInput, {
      props: {
        error: "必須です",
        label: "ノート名",
        modelValue: "",
      },
    });

    expect(button.classes()).toContain("app-button-primary");
    expect(iconButton.attributes("aria-label")).toBe("元に戻す");
    expect(tabs.findAll("[role='tab']")[1].attributes("aria-selected")).toBe("true");
    expect(input.text()).toContain("必須です");
  });
});
