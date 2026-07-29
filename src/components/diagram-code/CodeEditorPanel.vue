<template>
  <section class="code-editor-panel" aria-label="p5.jsコードエディタ">
    <nav class="code-editor-panel__files" aria-label="ファイル一覧">
      <button
        v-for="file in project.files"
        :key="file.path"
        :aria-current="file.path === selectedPath"
        type="button"
        @click="$emit('select-file', file.path)"
      >
        {{ file.path }}
      </button>
      <AppIconButton
        icon="note_add"
        label="JavaScriptファイルを追加"
        @click="isCreateDialogOpen = true"
      />
    </nav>
    <textarea
      class="code-editor-panel__editor"
      :data-language="selectedFile?.language"
      :value="selectedFile?.content"
      data-testid="code-editor"
      spellcheck="false"
      @input="$emit('update-file', selectedPath, ($event.target as HTMLTextAreaElement).value)"
    />
    <P5FileCreateDialog
      v-if="isCreateDialogOpen"
      :project="project"
      @add="addFile"
      @close="isCreateDialogOpen = false"
    />
  </section>
</template>

<script lang="ts">
import { computed, defineComponent, ref, type PropType } from "vue";
import AppIconButton from "@/components/ui/AppIconButton.vue";
import P5FileCreateDialog from "@/components/diagram-code/P5FileCreateDialog.vue";
import type { P5Project } from "@/features/diagram-code/p5Project";

export default defineComponent({
  name: "CodeEditorPanel",
  components: {
    AppIconButton,
    P5FileCreateDialog,
  },
  props: {
    project: {
      required: true,
      type: Object as PropType<P5Project>,
    },
    selectedPath: {
      required: true,
      type: String,
    },
  },
  emits: ["add-file", "select-file", "update-file"],
  setup(props, { emit }) {
    const isCreateDialogOpen = ref(false);
    const selectedFile = computed(() => props.project.files.find((file) => file.path === props.selectedPath));
    const addFile = (fileName: string) => {
      emit("add-file", fileName);
      isCreateDialogOpen.value = false;
    };

    return {
      addFile,
      isCreateDialogOpen,
      selectedFile,
    };
  },
});
</script>

<style scoped>
.code-editor-panel {
  display: grid;
  grid-template-columns: minmax(6.5rem, 8rem) minmax(0, 1fr);
  gap: var(--space-3);
  height: 100%;
  width: 100%;
  min-width: 0;
  min-height: 0;
}

.code-editor-panel__files {
  display: grid;
  align-content: start;
  grid-auto-rows: minmax(2rem, auto);
  gap: var(--space-2);
  min-height: 0;
  overflow: auto;
}

.code-editor-panel__files button {
  min-height: 2rem;
  border-radius: var(--radius-xs);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.75rem;
}

.code-editor-panel__files button[aria-current="true"] {
  box-shadow: var(--shadow-inset);
  color: var(--color-blue);
  font-weight: 800;
}

.code-editor-panel textarea {
  height: 100%;
  min-height: 0;
  resize: none;
  border: 0;
  border-radius: var(--radius-md);
  background: #f8fafc;
  box-shadow: var(--shadow-inset);
  color: var(--color-text-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.78rem;
  line-height: 1.6;
  padding: var(--space-3);
}

@media (width < 768px) {
  .code-editor-panel {
    grid-template-columns: 1fr;
    grid-template-rows: auto minmax(0, 1fr);
  }

  .code-editor-panel__files {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    max-height: 8rem;
  }
}
</style>
