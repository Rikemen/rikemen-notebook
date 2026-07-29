<template>
  <button
    aria-label="パネルサイズ変更"
    class="resize-handle"
    data-testid="resize-handle"
    title="パネルサイズ変更"
    type="button"
    @pointerdown="$emit('start-resize', $event)"
  />
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "ResizeHandle",
  emits: ["start-resize"],
});
</script>

<style scoped>
.resize-handle {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 2rem;
  height: 2rem;
  cursor: nwse-resize;
  border: 0;
  background: transparent;
  touch-action: none;
}

.resize-handle::after {
  position: absolute;
  right: 0.4rem;
  bottom: 0.4rem;
  width: 0.7rem;
  height: 0.7rem;
  border-right: 2px solid var(--color-text-muted);
  border-bottom: 2px solid var(--color-text-muted);
  content: "";
}

.resize-handle:focus-visible {
  border-radius: var(--radius-xs);
  box-shadow: var(--shadow-focus);
  outline: none;
}
</style>
