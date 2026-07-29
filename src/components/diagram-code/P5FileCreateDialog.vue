<template>
  <div
    class="p5-file-create-dialog"
    role="dialog"
    aria-modal="true"
    aria-labelledby="p5-file-create-dialog-title"
    @click.self="$emit('close')"
  >
    <form class="p5-file-create-dialog__panel" @submit.prevent="submit">
      <header>
        <h3 id="p5-file-create-dialog-title">JavaScriptファイルを追加</h3>
        <AppIconButton icon="close" label="閉じる" @click="$emit('close')" />
      </header>
      <label for="p5-file-name">ファイル名</label>
      <input
        id="p5-file-name"
        ref="fileNameInput"
        v-model="fileName"
        autocomplete="off"
        placeholder="Graph.js"
      />
      <p v-if="errorMessage" class="p5-file-create-dialog__error" role="alert">{{ errorMessage }}</p>
      <footer>
        <button class="p5-file-create-dialog__cancel" type="button" @click="$emit('close')">キャンセル</button>
        <button class="p5-file-create-dialog__create" type="submit">追加</button>
      </footer>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent, nextTick, onMounted, ref, type PropType } from "vue";
import AppIconButton from "@/components/ui/AppIconButton.vue";
import { validateP5FileName, type P5Project } from "@/features/diagram-code/p5Project";

export default defineComponent({
  name: "P5FileCreateDialog",
  components: {
    AppIconButton,
  },
  props: {
    project: {
      required: true,
      type: Object as PropType<P5Project>,
    },
  },
  emits: ["add", "close"],
  setup(props, { emit }) {
    const errorMessage = ref("");
    const fileName = ref("");
    const fileNameInput = ref<HTMLInputElement>();
    const submit = () => {
      errorMessage.value = validateP5FileName(fileName.value, props.project);
      if (errorMessage.value) {
        return;
      }
      emit("add", fileName.value.trim());
    };

    onMounted(async () => {
      await nextTick();
      fileNameInput.value?.focus();
    });

    return {
      errorMessage,
      fileName,
      fileNameInput,
      submit,
    };
  },
});
</script>

<style scoped>
.p5-file-create-dialog {
  position: fixed;
  z-index: 140;
  inset: 0;
  display: grid;
  place-items: center;
  padding: var(--space-4);
  background: rgb(15 23 42 / 28%);
}

.p5-file-create-dialog__panel {
  display: grid;
  gap: var(--space-3);
  width: min(25rem, 100%);
  padding: var(--space-5);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-raised-lg);
}

.p5-file-create-dialog header,
.p5-file-create-dialog footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.p5-file-create-dialog h3,
.p5-file-create-dialog p {
  margin: 0;
}

.p5-file-create-dialog h3 {
  font-size: 1rem;
}

.p5-file-create-dialog label {
  color: var(--color-text-secondary);
  font-size: 0.82rem;
  font-weight: 800;
}

.p5-file-create-dialog input {
  min-width: 0;
  padding: 0.7rem 0.8rem;
  border: 0;
  border-radius: var(--radius-sm);
  background: #f8fafc;
  box-shadow: var(--shadow-inset);
  color: var(--color-text-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.p5-file-create-dialog__error {
  color: var(--color-red);
  font-size: 0.8rem;
}

.p5-file-create-dialog footer {
  justify-content: flex-end;
}

.p5-file-create-dialog footer button {
  min-height: 2.25rem;
  padding: 0 var(--space-4);
  border-radius: var(--radius-sm);
  font-weight: 800;
}

.p5-file-create-dialog__cancel {
  background: var(--color-surface);
  box-shadow: var(--shadow-raised-sm);
  color: var(--color-text-secondary);
}

.p5-file-create-dialog__create {
  background: var(--color-blue);
  color: #fff;
}
</style>
