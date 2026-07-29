<template>
  <form class="ai-chat-composer" @submit.prevent="$emit('submit', modelValue)">
    <input
      :disabled="disabled"
      :value="modelValue"
      data-testid="ai-prompt"
      placeholder="数学について質問してください..."
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <button :disabled="disabled" aria-label="送信" type="submit">→</button>
  </form>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "AiChatComposer",
  props: {
    disabled: {
      default: false,
      type: Boolean,
    },
    modelValue: {
      required: true,
      type: String,
    },
  },
  emits: ["submit", "update:modelValue"],
});
</script>

<style scoped>
.ai-chat-composer {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.ai-chat-composer input {
  min-width: 0;
  flex: 1;
  min-height: 2.4rem;
  border: 0;
  border-radius: var(--radius-md);
  background: var(--color-surface-inset);
  box-shadow: var(--shadow-inset);
  color: var(--color-text-primary);
  padding: 0 var(--space-3);
}

.ai-chat-composer button {
  width: 2.4rem;
  height: 2.4rem;
  border-radius: var(--radius-pill);
  background: var(--color-blue);
  color: white;
  font-size: 1.2rem;
  font-weight: 800;
}

.ai-chat-composer :disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
