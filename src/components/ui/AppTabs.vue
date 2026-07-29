<template>
  <div class="app-tabs" role="tablist">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      class="app-tab"
      :aria-selected="tab.value === modelValue"
      role="tab"
      type="button"
      @click="$emit('update:modelValue', tab.value)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

export interface AppTabItem {
  label: string;
  value: string;
}

export default defineComponent({
  name: "AppTabs",
  props: {
    modelValue: {
      required: true,
      type: String,
    },
    tabs: {
      required: true,
      type: Array as PropType<AppTabItem[]>,
    },
  },
  emits: ["update:modelValue"],
});
</script>

<style scoped>
.app-tabs {
  display: flex;
  gap: var(--space-2);
}

.app-tab {
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  min-height: 32px;
  padding: 0 12px;
}

.app-tab[aria-selected="true"] {
  box-shadow: var(--shadow-inset);
  color: var(--color-blue);
}
</style>

