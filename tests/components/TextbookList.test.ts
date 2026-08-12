import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import TextbookList from "@/components/textbook/TextbookList.vue";

const savedMaterial = {
  id: "material-1",
  kind: "pdf" as const,
  pageCount: 4,
  sizeLabel: "100.0 MB",
  status: "saved" as const,
  title: "解析.pdf",
  uploadedAt: "2026/08/08",
};

describe("TextbookList", () => {
  it("保存済み資料を編集し、Enterで正規化した資料名を通知する", async () => {
    const wrapper = mount(TextbookList, {
      props: { selectedId: "material-1", textbooks: [savedMaterial] },
    });

    await wrapper.get("[aria-label='解析.pdfの資料名を変更']").trigger("click");
    const input = wrapper.get("[aria-label='資料名']");
    await input.setValue("  微分積分.pdf  ");
    await input.trigger("keydown.enter");

    expect(wrapper.emitted("rename")).toEqual([[["material-1", "微分積分.pdf"]]]);
  });

  it("Escapeでは保存せず編集を終了する", async () => {
    const wrapper = mount(TextbookList, {
      props: { selectedId: "material-1", textbooks: [savedMaterial] },
    });
    await wrapper.get("[aria-label='解析.pdfの資料名を変更']").trigger("click");
    await wrapper.get("[aria-label='資料名']").setValue("別名.pdf");
    await wrapper.get("[aria-label='資料名']").trigger("keydown.escape");

    expect(wrapper.emitted("rename")).toBeUndefined();
    expect(wrapper.find("[aria-label='資料名']").exists()).toBe(false);
  });

  it("保存中の資料では名称変更を無効にし、アップロード進捗と取消を表示する", async () => {
    const wrapper = mount(TextbookList, {
      props: {
        selectedId: "material-1",
        textbooks: [{ ...savedMaterial, status: "saving" as const, uploadProgress: 0.42 }],
      },
    });

    expect(wrapper.get("[aria-label='解析.pdfの資料名を変更']").attributes("disabled")).toBeDefined();
    expect(wrapper.text()).toContain("保存中 42%");
    await wrapper.get("[aria-label='解析.pdfのアップロードを取消']").trigger("click");
    expect(wrapper.emitted("cancel-upload")).toEqual([["material-1"]]);
  });

  it("保存失敗した資料に再試行を表示する", async () => {
    const wrapper = mount(TextbookList, {
      props: { selectedId: "material-1", textbooks: [{ ...savedMaterial, status: "error" as const }] },
    });

    await wrapper.get("[aria-label='解析.pdfのアップロードを再試行']").trigger("click");
    expect(wrapper.emitted("retry-upload")).toEqual([["material-1"]]);
  });
});
