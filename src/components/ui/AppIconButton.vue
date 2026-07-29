<template>
  <button class="app-icon-button" :aria-label="label" :title="tooltip || label" :type="type" @click="$emit('click', $event)">
    <span class="material-symbols-outlined text-base" aria-hidden="true">{{ icon }}</span>
  </button>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

type ButtonType = "button" | "submit" | "reset";

export default defineComponent({
  name: "AppIconButton",
  props: {
    icon: {
      required: true,
      type: String,
    },
    label: {
      required: true,
      type: String,
    },
    tooltip: {
      default: "",
      type: String,
    },
    type: {
      default: "button",
      type: String as PropType<ButtonType>,
    },
  },
  emits: ["click"],
});
</script>

<style scoped>
.app-icon-button {
  align-items: center;
  background: var(--color-surface);
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: var(--radius-xs);
  box-shadow: var(--shadow-raised-sm);
  color: var(--color-icon);
  display: inline-flex;
  height: 36px;
  justify-content: center;
  min-width: 36px;
}

.app-icon-button:hover {
  color: var(--color-blue);
}

.app-icon-button:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);
}
</style>

