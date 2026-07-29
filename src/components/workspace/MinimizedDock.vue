<template>
  <nav v-if="panels.length" aria-label="最小化パネル" class="minimized-dock">
    <button
      v-for="panel in panels"
      :key="panel.id"
      class="minimized-dock__item"
      type="button"
      @click="$emit('restore', panel.id)"
    >
      {{ panel.title }}
    </button>
  </nav>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { PanelLayoutItem } from "@/features/workspace/panelLayout";

export default defineComponent({
  name: "MinimizedDock",
  props: {
    panels: {
      default: () => [],
      type: Array as PropType<PanelLayoutItem[]>,
    },
  },
  emits: ["restore"],
});
</script>

<style scoped>
.minimized-dock {
  position: fixed;
  right: var(--space-4);
  bottom: var(--space-4);
  left: var(--space-4);
  z-index: 40;
  display: flex;
  gap: var(--space-2);
  align-items: center;
  min-height: 3rem;
  padding: var(--space-2);
  border-radius: var(--radius-lg);
  background: rgb(245 247 251 / 92%);
  box-shadow: var(--shadow-raised);
}

.minimized-dock__item {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.85rem;
  font-weight: 700;
  padding: 0.45rem 0.75rem;
}
</style>

