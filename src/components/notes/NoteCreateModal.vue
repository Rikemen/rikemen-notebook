<template>
  <div class="note-create-modal" role="dialog" aria-modal="true" aria-labelledby="note-create-modal-title">
    <section class="note-create-modal__panel">
      <header class="note-create-modal__header">
        <h2 id="note-create-modal-title">ノートブック新規作成</h2>
        <button class="note-create-modal__close" type="button" aria-label="閉じる" @click="$emit('close')">×</button>
      </header>
      <CreateNoteForm :disabled="disabled" @create="$emit('create', $event)" />
      <footer class="note-create-modal__footer">
        <button class="note-create-modal__cancel" type="button" @click="$emit('close')">キャンセル</button>
      </footer>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import type { CreateNoteInput } from "@/features/notes/types";
import CreateNoteForm from "@/components/notes/CreateNoteForm.vue";

export default defineComponent({
  name: "NoteCreateModal",
  components: {
    CreateNoteForm,
  },
  props: {
    disabled: {
      default: false,
      type: Boolean,
    },
  },
  emits: {
    close: () => true,
    create: (__input: CreateNoteInput) => true,
  },
});
</script>

<style scoped>
.note-create-modal {
  position: fixed;
  z-index: 80;
  inset: 0;
  display: grid;
  place-items: center;
  box-sizing: border-box;
  background: rgba(23, 26, 32, 0.28);
  padding: var(--space-4);
}

.note-create-modal__panel {
  display: grid;
  gap: var(--space-4);
  box-sizing: border-box;
  width: min(640px, 100%);
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-raised);
  padding: var(--space-5);
}

.note-create-modal__header,
.note-create-modal__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.note-create-modal h2 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 1.05rem;
  font-weight: 800;
}

.note-create-modal__close,
.note-create-modal__cancel {
  min-height: 34px;
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  box-shadow: var(--shadow-raised-sm);
  color: var(--color-text-secondary);
  font-weight: 800;
  padding: 0 var(--space-3);
}

.note-create-modal__close:hover {
  color: var(--color-red);
}

.note-create-modal__footer {
  justify-content: end;
}
</style>
