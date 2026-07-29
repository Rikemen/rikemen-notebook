import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import MathRenderer from "@/components/math/MathRenderer.vue";

describe("MathRenderer", () => {
  it("基本数式を文字化けしない表示へ変換する", () => {
    const wrapper = mount(MathRenderer, {
      props: {
        expression: "\\int_0^1 x^2 dx",
      },
    });

    expect(wrapper.attributes("role")).toBe("math");
    expect(wrapper.attributes("data-engine")).toBe("katex-pending");
    expect(wrapper.text()).toContain("∫");
    expect(wrapper.text()).toContain("x²");
  });
});

