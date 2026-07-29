import { describe, expect, it } from "vitest";
import { prepareP5Run } from "@/features/diagram-code/codeExecution";
import { createDefaultP5Project, updateProjectFile } from "@/features/diagram-code/p5Project";

describe("codeExecution", () => {
  it("srcdoc生成成功と未許可scriptエラーを返す", () => {
    const project = createDefaultP5Project();
    const invalidProject = updateProjectFile(
      project,
      "index.html",
      '<!doctype html><script src="https://example.com/unsafe.js"></script>',
    );

    expect(prepareP5Run(project, "run-1")).toMatchObject({ status: "running" });
    expect(prepareP5Run(invalidProject, "run-2")).toMatchObject({ status: "error" });
  });
});
