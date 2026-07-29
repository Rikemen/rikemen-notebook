import { describe, expect, it } from "vitest";
import { createDefaultP5Project, updateProjectFile } from "@/features/diagram-code/p5Project";
import { buildP5Srcdoc } from "@/features/diagram-code/p5Srcdoc";

describe("p5Srcdoc", () => {
  it("ローカルCSSとJSをindex.htmlの順序で埋め込む", () => {
    const project = createDefaultP5Project();
    const result = buildP5Srcdoc(project, "run-1");

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.srcdoc).toContain("Content-Security-Policy");
    expect(result.srcdoc).toContain("gauss-p5-runtime");
    expect(result.srcdoc).toContain("run-1");
    expect(result.srcdoc).toContain("function setup()");
    expect(result.srcdoc).not.toContain('src="sketch.js"');
    expect(result.srcdoc).not.toContain('href="style.css"');
  });

  it("存在しないローカルファイルと未許可remote scriptを拒否する", () => {
    const project = createDefaultP5Project();
    const missing = updateProjectFile(
      project,
      "index.html",
      '<!doctype html><script src="missing.js"></script>',
    );
    const remote = updateProjectFile(
      project,
      "index.html",
      '<!doctype html><script src="https://example.com/code.js"></script>',
    );

    expect(buildP5Srcdoc(missing, "run-1")).toMatchObject({ ok: false });
    expect(buildP5Srcdoc(remote, "run-2")).toMatchObject({ ok: false });
  });
});
