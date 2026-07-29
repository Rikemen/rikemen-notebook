import { describe, expect, it } from "vitest";
import { APP_NAME } from "@/config/appBrand";

describe("appBrand", () => {
  it("アプリ名をGauss Notebookとして定義する", () => {
    expect(APP_NAME).toBe("Gauss Notebook");
  });
});

