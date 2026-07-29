import type { P5Project } from "@/features/diagram-code/p5Project";
import { buildP5Srcdoc } from "@/features/diagram-code/p5Srcdoc";

export type CodeExecutionStatus = "idle" | "running" | "success" | "error";

export type CodeExecutionResult =
  | { message: string; srcdoc: string; status: "running"; version: string }
  | { message: string; srcdoc: ""; status: "error"; version: "" };

export const prepareP5Run = (
  project: P5Project,
  runId: string,
): CodeExecutionResult => {
  const result = buildP5Srcdoc(project, runId);
  if (!result.ok) {
    return {
      message: result.error,
      srcdoc: "",
      status: "error",
      version: "",
    };
  }
  return {
    message: "スケッチを実行しています。",
    srcdoc: result.srcdoc,
    status: "running",
    version: result.version,
  };
};
