<template>
  <div class="whiteboard-drawing-dialog__backdrop" @click.self="$emit('close')">
    <section
      aria-label="手書き画像の操作"
      aria-modal="true"
      class="whiteboard-drawing-dialog"
      role="dialog"
    >
      <header>
        <h2>手書き画像</h2>
        <AppIconButton icon="close" label="閉じる" @click="$emit('close')" />
      </header>
      <div class="whiteboard-drawing-dialog__preview">
        <img :src="drawing.dataUrl" alt="手書きメモ" />
      </div>
      <footer>
        <button class="whiteboard-drawing-dialog__delete" data-testid="delete-drawing" type="button" @click="$emit('delete')">
          削除する
        </button>
        <button class="whiteboard-drawing-dialog__edit" data-testid="edit-drawing" type="button" @click="$emit('edit')">
          編集する
        </button>
      </footer>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent, onBeforeUnmount, onMounted, type PropType } from "vue";
import AppIconButton from "@/components/ui/AppIconButton.vue";
import type { WhiteboardDrawing } from "@/features/whiteboard/whiteboardDrawings";

export default defineComponent({
  name: "WhiteboardDrawingDialog",
  components: {
    AppIconButton,
  },
  props: {
    drawing: {
      required: true,
      type: Object as PropType<WhiteboardDrawing>,
    },
  },
  emits: ["close", "delete", "edit"],
  setup(_props, { emit }) {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        emit("close");
      }
    };

    onMounted(() => window.addEventListener("keydown", handleKeydown));
    onBeforeUnmount(() => window.removeEventListener("keydown", handleKeydown));
  },
});
</script>

<style scoped>
.whiteboard-drawing-dialog__backdrop {
  position: fixed;
  z-index: 85;
  inset: 0;
  display: grid;
  place-items: center;
  box-sizing: border-box;
  background: rgb(0 0 0 / 20%);
  padding: var(--space-4);
}

.whiteboard-drawing-dialog {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: var(--space-3);
  width: min(720px, 100%);
  max-height: min(760px, calc(100dvh - 2 * var(--space-4)));
  min-height: 0;
  border: 1px solid rgb(255 255 255 / 65%);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-raised);
  padding: var(--space-4);
}

.whiteboard-drawing-dialog header,
.whiteboard-drawing-dialog footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.whiteboard-drawing-dialog h2 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 1rem;
}

.whiteboard-drawing-dialog__preview {
  min-height: 0;
  overflow: auto;
}

.whiteboard-drawing-dialog__preview img {
  display: block;
  max-width: 100%;
  margin: 0 auto;
  border-radius: var(--radius-sm);
  background: white;
  box-shadow: var(--shadow-inset);
}

.whiteboard-drawing-dialog footer {
  justify-content: flex-end;
}

.whiteboard-drawing-dialog footer button {
  min-height: 40px;
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-raised-sm);
  font-weight: 800;
  padding: 0 var(--space-3);
}

.whiteboard-drawing-dialog__edit {
  background: var(--color-blue);
  color: white;
}

.whiteboard-drawing-dialog__delete {
  background: var(--color-red-soft);
  color: var(--color-red);
}

@media (max-width: 767px) {
  .whiteboard-drawing-dialog__backdrop {
    padding: var(--space-2);
  }

  .whiteboard-drawing-dialog {
    max-height: calc(100dvh - 2 * var(--space-2));
    padding: var(--space-3);
  }
}
</style>
