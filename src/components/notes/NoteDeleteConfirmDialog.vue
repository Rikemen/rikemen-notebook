<template>
  <div
    class="note-delete-confirm-dialog"
    role="dialog"
    aria-modal="true"
    aria-labelledby="note-delete-confirm-dialog-title"
    aria-describedby="note-delete-confirm-dialog-impact"
    @click.self="$emit('close')"
  >
    <section class="note-delete-confirm-dialog__panel">
      <header class="note-delete-confirm-dialog__header">
        <h2 id="note-delete-confirm-dialog-title">本当に削除していいですか？</h2>
      </header>
      <div class="note-delete-confirm-dialog__content">
        <p>
          ノートブック
          <strong>「{{ noteTitle }}」</strong>
          を削除します。
        </p>
        <p id="note-delete-confirm-dialog-impact">紐づくPDF・画像・手書き・AIチャットも削除されます。この操作は取り消せません。</p>
      </div>
      <footer class="note-delete-confirm-dialog__actions">
        <AppButton ref="cancelButton" data-testid="cancel-note-delete" variant="secondary" @click="$emit('close')"> キャンセル </AppButton>
        <AppButton class="note-delete-confirm-dialog__confirm" data-testid="confirm-note-delete" variant="danger" @click="$emit('confirm')">
          削除する
        </AppButton>
      </footer>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent, onBeforeUnmount, onMounted, ref, type ComponentPublicInstance } from "vue";
import AppButton from "@/components/ui/AppButton.vue";

export default defineComponent({
  name: "NoteDeleteConfirmDialog",
  components: {
    AppButton,
  },
  props: {
    noteTitle: {
      required: true,
      type: String,
    },
  },
  emits: {
    close: () => true,
    confirm: () => true,
  },
  setup(__props, { emit }) {
    const cancelButton = ref<ComponentPublicInstance>();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        emit("close");
      }
    };

    onMounted(() => {
      window.addEventListener("keydown", closeOnEscape);
      const cancelElement = cancelButton.value?.$el as HTMLButtonElement | undefined;
      cancelElement?.focus();
    });
    onBeforeUnmount(() => window.removeEventListener("keydown", closeOnEscape));

    return {
      cancelButton,
    };
  },
});
</script>

<style scoped>
.note-delete-confirm-dialog {
  position: fixed;
  z-index: 100;
  inset: 0;
  display: grid;
  place-items: center;
  box-sizing: border-box;
  overflow-y: auto;
  background: rgb(0 0 0 / 20%);
  padding: var(--space-4);
}

.note-delete-confirm-dialog__panel {
  display: grid;
  gap: var(--space-4);
  box-sizing: border-box;
  width: min(32rem, 100%);
  max-height: calc(100dvh - var(--space-8));
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-raised);
  color: var(--color-text-primary);
  padding: var(--space-6);
}

.note-delete-confirm-dialog__header h2,
.note-delete-confirm-dialog__content p {
  margin: 0;
}

.note-delete-confirm-dialog__header h2 {
  font-size: 1.05rem;
  font-weight: 800;
  line-height: 1.5;
}

.note-delete-confirm-dialog__content {
  display: grid;
  gap: var(--space-3);
  color: var(--color-text-secondary);
  line-height: 1.65;
}

.note-delete-confirm-dialog__content strong {
  overflow-wrap: anywhere;
  color: var(--color-text-primary);
}

.note-delete-confirm-dialog__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-3);
}

.note-delete-confirm-dialog__actions :deep(.app-button) {
  min-width: 7.5rem;
}

.note-delete-confirm-dialog__actions :deep(.note-delete-confirm-dialog__confirm) {
  border-color: var(--color-red);
  background: var(--color-red);
  box-shadow: var(--shadow-raised-sm);
  color: var(--color-surface-strong);
}

.note-delete-confirm-dialog__actions :deep(.note-delete-confirm-dialog__confirm:hover) {
  background: var(--color-red-hover);
}

.note-delete-confirm-dialog__actions :deep(.note-delete-confirm-dialog__confirm:active) {
  background: var(--color-red-active);
}

@media (max-width: 30rem) {
  .note-delete-confirm-dialog {
    padding: var(--space-3);
  }

  .note-delete-confirm-dialog__panel {
    max-height: calc(100dvh - var(--space-6));
    padding: var(--space-4);
  }

  .note-delete-confirm-dialog__actions {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }

  .note-delete-confirm-dialog__actions :deep(.app-button) {
    width: 100%;
  }
}
</style>
