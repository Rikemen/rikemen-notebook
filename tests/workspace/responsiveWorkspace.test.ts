import { describe, expect, it } from "vitest";
import { getWorkspaceResponsivePolicy } from "@/features/workspace/responsiveWorkspace";

describe("responsiveWorkspace", () => {
  it("viewport幅ごとに操作モードを分ける", () => {
    expect(getWorkspaceResponsivePolicy(1280)).toMatchObject({
      allowFreeMove: true,
      columns: 4,
      mode: "desktop",
    });
    expect(getWorkspaceResponsivePolicy(1279)).toMatchObject({
      allowFreeMove: false,
      columns: 2,
      mode: "tablet",
    });
    expect(getWorkspaceResponsivePolicy(900)).toMatchObject({
      allowFreeMove: false,
      columns: 2,
      mode: "tablet",
    });
    expect(getWorkspaceResponsivePolicy(767)).toMatchObject({
      allowResize: false,
      columns: 1,
      mode: "mobile",
    });
    expect(getWorkspaceResponsivePolicy(390)).toMatchObject({
      allowResize: false,
      columns: 1,
      mode: "mobile",
    });
  });
});
