<template>
  <button class="app-button" :class="variantClass" :disabled="disabled" :type="type">
    <slot />
  </button>
</template>

<script lang="ts">
import { computed, defineComponent, type PropType } from "vue";

type ButtonVariant = "primary" | "secondary" | "danger";
type ButtonType = "button" | "submit" | "reset";

const variantClassMap: Record<ButtonVariant, string> = {
  danger: "app-button-danger",
  primary: "app-button-primary",
  secondary: "app-button-secondary",
};

export default defineComponent({
  name: "AppButton",
  props: {
    disabled: {
      default: false,
      type: Boolean,
    },
    type: {
      default: "button",
      type: String as PropType<ButtonType>,
    },
    variant: {
      default: "secondary",
      type: String as PropType<ButtonVariant>,
    },
  },
  setup(props) {
    const variantClass = computed(() => variantClassMap[props.variant]);

    return {
      variantClass,
    };
  },
});
</script>

<style scoped>
.app-button {
  min-height: 38px;
  border-radius: var(--radius-sm);
  padding: 0 16px;
  transition: transform 120ms ease-out, color 120ms ease-out, background 120ms ease-out;
}

.app-button:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);
}

.app-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.app-button-primary {
  background: var(--color-blue);
  box-shadow: var(--shadow-raised-sm);
  color: white;
}

.app-button-primary:hover {
  background: var(--color-blue-hover);
}

.app-button-secondary {
  background: var(--color-surface);
  border: 1px solid rgba(255, 255, 255, 0.72);
  box-shadow: var(--shadow-raised-sm);
  color: var(--color-text-primary);
}

.app-button-secondary:active {
  color: var(--color-blue);
  box-shadow: var(--shadow-inset);
}

.app-button-danger {
  background: white;
  border: 1px solid var(--color-red-soft);
  color: var(--color-red);
}

.app-button-danger:hover {
  background: var(--color-red-soft);
}
</style>

