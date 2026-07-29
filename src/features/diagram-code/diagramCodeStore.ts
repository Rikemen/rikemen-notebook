/* eslint-disable max-lines-per-function, max-statements */
import { defineStore } from "pinia";
import { ref } from "vue";
import { prepareP5Run, type CodeExecutionStatus } from "@/features/diagram-code/codeExecution";
import {
  addProjectJavaScriptFile,
  createDefaultP5Project,
  updateProjectFile,
  type P5Project,
} from "@/features/diagram-code/p5Project";
import type { DiagramCodeMode } from "@/features/diagram-code/types";

export interface DiagramCodeDocumentState {
  executionMessage: string;
  executionStatus: CodeExecutionStatus;
  mode: DiagramCodeMode;
  project: P5Project;
  runId: string;
  selectedPath: string;
  srcdoc: string;
  version: string;
}

type DiagramCodeDocuments = Record<string, DiagramCodeDocumentState>;
let runSequence = 0;

const nextRunId = () => {
  runSequence += 1;
  return `p5-run-${runSequence}`;
};

const createDiagramCodeDocument = (): DiagramCodeDocumentState => {
  const project = createDefaultP5Project();
  const runId = nextRunId();
  const execution = prepareP5Run(project, runId);

  const document: DiagramCodeDocumentState = {
    executionMessage: execution.message,
    executionStatus: execution.status,
    mode: "diagram",
    project,
    runId: "",
    selectedPath: project.entryPath,
    srcdoc: execution.srcdoc,
    version: execution.version,
  };
  if (execution.status === "running") {
    document.runId = runId;
  }
  return document;
};

export const useDiagramCodeStore = defineStore("diagramCode", () => {
  const documentsByNoteId = ref<DiagramCodeDocuments>({});

  const documentForNote = (noteId: string) => {
    if (!documentsByNoteId.value[noteId]) {
      documentsByNoteId.value[noteId] = createDiagramCodeDocument();
    }

    return documentsByNoteId.value[noteId];
  };

  const selectFile = (noteId: string, path: string) => {
    const document = documentForNote(noteId);
    if (document.project.files.some((file) => file.path === path)) {
      document.selectedPath = path;
    }
  };

  const setMode = (noteId: string, mode: DiagramCodeMode) => {
    documentForNote(noteId).mode = mode;
  };

  const updateFile = (noteId: string, path: string, content: string) => {
    const document = documentForNote(noteId);
    document.project = updateProjectFile(document.project, path, content);
  };

  const addJavaScriptFile = (noteId: string, fileName: string) => {
    const document = documentForNote(noteId);
    const result = addProjectJavaScriptFile(document.project, fileName);
    if (!result.ok) {
      document.executionMessage = result.error;
      document.executionStatus = "error";
      return false;
    }
    document.project = result.project;
    document.selectedPath = fileName.trim();
    return true;
  };

  const runProject = (noteId: string) => {
    const document = documentForNote(noteId);
    const runId = nextRunId();
    const result = prepareP5Run(document.project, runId);
    document.executionMessage = result.message;
    document.executionStatus = result.status;
    document.runId = "";
    if (result.status === "running") {
      document.runId = runId;
    }
    document.srcdoc = result.srcdoc;
    document.version = result.version;
  };

  const stopProject = (noteId: string) => {
    const document = documentForNote(noteId);
    document.executionMessage = "スケッチを停止しました。";
    document.executionStatus = "idle";
    document.runId = "";
    document.srcdoc = "";
  };

  const markRuntimeReady = (noteId: string) => {
    const document = documentForNote(noteId);
    if (document.executionStatus === "running") {
      document.executionMessage = "スケッチを実行しました。";
      document.executionStatus = "success";
    }
  };

  const markRuntimeError = (noteId: string, message: string) => {
    const document = documentForNote(noteId);
    document.executionMessage = message;
    document.executionStatus = "error";
  };

  return {
    addJavaScriptFile,
    documentForNote,
    documentsByNoteId,
    markRuntimeError,
    markRuntimeReady,
    runProject,
    selectFile,
    setMode,
    stopProject,
    updateFile,
  };
});
