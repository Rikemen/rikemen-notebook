import { describe, expect, it } from "vitest";
import {
  addProjectJavaScriptFile,
  createDefaultP5Project,
  findEntryFile,
  updateProjectFile,
  validateP5FileName,
} from "@/features/diagram-code/p5Project";

describe("p5ProjectModel", () => {
  it("index.html、style.css、sketch.jsを標準構造にする", () => {
    const project = createDefaultP5Project();
    const updated = updateProjectFile(project, "style.css", "body { margin: 0; }");

    expect(project.files.map((file) => file.path)).toEqual(["index.html", "style.css", "sketch.js"]);
    expect(project.files.map((file) => file.language)).toEqual(["html", "css", "javascript"]);
    expect(findEntryFile(project)?.path).toBe("index.html");
    expect(findEntryFile(project)?.content).toContain("p5@2.3.0");
    expect(updated.files.find((file) => file.path === "style.css")?.content).toBe("body { margin: 0; }");
  });

  it("安全なJavaScriptファイルだけを重複せず追加する", () => {
    const project = createDefaultP5Project();
    const result = addProjectJavaScriptFile(project, "Graph.js");

    expect(result.ok).toBe(true);
    expect(result.project.files.map((file) => file.path)).toContain("Graph.js");
    expect(project.files.map((file) => file.path)).not.toContain("Graph.js");
    expect(validateP5FileName("graph.js", result.project)).toContain("同じ名前");
    expect(validateP5FileName("../graph.js", project)).toContain("使用できない");
    expect(validateP5FileName("graph.ts", project)).toContain(".js");
  });
});
