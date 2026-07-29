import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import P5RuntimePreview from "@/components/diagram-code/P5RuntimePreview.vue";

describe("P5RuntimePreview", () => {
  it("allow-scriptsだけのsandbox iframeへsrcdocを渡す", () => {
    const wrapper = mount(P5RuntimePreview, {
      props: {
        runId: "run-1",
        srcdoc: "<!doctype html><p>preview</p>",
      },
    });

    const iframe = wrapper.get("iframe");
    expect(iframe.attributes("sandbox")).toBe("allow-scripts");
    expect(iframe.attributes("sandbox")).not.toContain("allow-same-origin");
    expect(iframe.attributes("srcdoc")).toContain("preview");
    expect(iframe.attributes("title")).toBe("p5.jsスケッチ実行結果");
  });

  it("停止状態ではiframeを破棄する", () => {
    const wrapper = mount(P5RuntimePreview, {
      props: {
        runId: "",
        srcdoc: "",
      },
    });

    expect(wrapper.find("iframe").exists()).toBe(false);
  });
});
