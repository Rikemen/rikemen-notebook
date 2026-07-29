<template>
  <label class="app-input-label">
    <span>{{ label }}</span>
    <input class="app-input" :value="modelValue" :aria-invalid="Boolean(error)" @input="updateValue" />
    <span v-if="error" class="app-input-error">{{ error }}</span>
  </label>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "AppInput",
  props: {
    error: {
      default: "",
      type: String,
    },
    label: {
      required: true,
      type: String,
    },
    modelValue: {
      default: "",
      type: String,
    },
  },
  emits: ["update:modelValue"],
  setup(_props, { emit }) {
    const updateValue = (event: Event) => {
      emit("update:modelValue", (event.target as HTMLInputElement).value);
    };

    return {
      updateValue,
    };
  },
});
</script>

<style scoped>
.app-input-label {
  color: var(--color-text-secondary);
  display: grid;
  font-size: 13px;
  gap: var(--space-2);
  line-height: 18px;
}

.app-input {
  background: var(--color-surface-inset);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-inset);
  color: var(--color-text-primary);
  min-height: 38px;
  padding: 0 12px;
}

.app-input:focus {
  border-color: var(--color-blue-focus);
  outline: none;
}

.app-input[aria-invalid="true"] {
  border-color: var(--color-red);
}

.app-input-error {
  color: var(--color-red);
  font-size: 12px;
}
</style>
