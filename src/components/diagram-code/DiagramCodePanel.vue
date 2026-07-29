<template>
  <div class="diagram-code-panel">
    <div class="diagram-code-panel__toolbar">
      <AppTabs :model-value="state.mode" :tabs="tabs" @update:model-value="setMode" />
      <div class="diagram-code-panel__toolbar-actions">
        <span class="diagram-code-panel__version">p5.js {{ p5Version || "未検出" }}</span>
        <button class="diagram-code-panel__download" type="button">ダウンロード</button>
      </div>
    </div>
    <P5RuntimePreview
      v-if="state.mode === 'diagram'"
      :run-id="state.runId"
      :srcdoc="state.srcdoc"
      @ready="markRuntimeReady"
      @runtime-error="markRuntimeError"
    />
    <CodeEditorPanel
      v-else
      :project="project"
      :selected-path="selectedPath"
      @add-file="addFile"
      @select-file="selectFile"
      @update-file="updateFile"
    />
    <div class="diagram-code-panel__run-row">
      <div class="diagram-code-panel__run-actions">
        <button class="diagram-code-panel__run" type="button" @click="runCode">
          {{ state.srcdoc ? "再実行" : "実行" }}
        </button>
        <AppIconButton icon="stop" label="スケッチを停止" @click="stopCode" />
      </div>
      <p v-if="state.executionMessage" :class="executionClass">{{ state.executionMessage }}</p>
    </div>
  </div>
</template>

<script lang="ts">
/* eslint-disable max-lines-per-function, max-statements */
import { computed, defineComponent } from "vue";
import { useDiagramCodeStore } from "@/features/diagram-code/diagramCodeStore";
import { detectP5Version } from "@/features/diagram-code/p5Version";
import type { DiagramCodeMode } from "@/features/diagram-code/types";
import AppTabs, { type AppTabItem } from "@/components/ui/AppTabs.vue";
import AppIconButton from "@/components/ui/AppIconButton.vue";
import CodeEditorPanel from "@/components/diagram-code/CodeEditorPanel.vue";
import P5RuntimePreview from "@/components/diagram-code/P5RuntimePreview.vue";

const tabs: AppTabItem[] = [
  {
    label: "図表",
    value: "diagram",
  },
  {
    label: "コード",
    value: "code",
  },
];

export default defineComponent({
  name: "DiagramCodePanel",
  components: {
    AppIconButton,
    AppTabs,
    CodeEditorPanel,
    P5RuntimePreview,
  },
  props: {
    noteId: {
      required: true,
      type: String,
    },
  },
  setup(props) {
    const store = useDiagramCodeStore();
    const state = computed(() => store.documentForNote(props.noteId));
    const project = computed(() => state.value.project);
    const selectedPath = computed(() => state.value.selectedPath);
    const executionClass = computed(
      () => `diagram-code-panel__message diagram-code-panel__message--${state.value.executionStatus}`,
    );
    const p5Version = computed(() => {
      const indexFile = project.value.files.find((file) => file.path === project.value.entryPath);
      if (!indexFile) {
        return "";
      }
      return detectP5Version(indexFile.content);
    });

    const addFile = (fileName: string) => store.addJavaScriptFile(props.noteId, fileName);
    const selectFile = (path: string) => {
      store.selectFile(props.noteId, path);
    };
    const updateFile = (path: string, content: string) => {
      store.updateFile(props.noteId, path, content);
    };
    const setMode = (mode: string) => {
      if (mode === "diagram" || mode === "code") {
        store.setMode(props.noteId, mode as DiagramCodeMode);
      }
    };
    const runCode = () => {
      store.runProject(props.noteId);
      if (state.value.executionStatus !== "error") {
        store.setMode(props.noteId, "diagram");
      }
    };
    const stopCode = () => store.stopProject(props.noteId);
    const markRuntimeReady = () => store.markRuntimeReady(props.noteId);
    const markRuntimeError = (message: string) => store.markRuntimeError(props.noteId, message);

    return {
      addFile,
      executionClass,
      markRuntimeError,
      markRuntimeReady,
      p5Version,
      project,
      runCode,
      selectFile,
      selectedPath,
      setMode,
      state,
      stopCode,
      tabs,
      updateFile,
    };
  },
});
</script>

<style scoped>
.diagram-code-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: var(--space-3);
  height: 100%;
  width: 100%;
  min-width: 0;
  min-height: 0;
}

.diagram-code-panel__toolbar,
.diagram-code-panel__run-row {
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  justify-content: space-between;
}

.diagram-code-panel__toolbar-actions,
.diagram-code-panel__run-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.diagram-code-panel__version {
  padding: 0.32rem 0.55rem;
  border-radius: var(--radius-xs);
  background: var(--color-blue-soft);
  color: var(--color-blue);
  font-size: 0.72rem;
  font-weight: 800;
}

.diagram-code-panel__download,
.diagram-code-panel__run {
  min-height: 2.1rem;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 800;
  padding: 0 var(--space-3);
}

.diagram-code-panel__download {
  background: var(--color-surface);
  box-shadow: var(--shadow-raised-sm);
  color: var(--color-blue);
}

.diagram-code-panel__run {
  background: var(--color-blue);
  color: white;
}

.diagram-code-panel__message {
  margin: 0;
  border-radius: var(--radius-md);
  font-size: 0.82rem;
  padding: var(--space-2) var(--space-3);
}

.diagram-code-panel__message--success {
  background: var(--color-blue-soft);
  color: var(--color-blue);
}

.diagram-code-panel__message--error {
  background: var(--color-red-soft);
  color: var(--color-red);
}
</style>
