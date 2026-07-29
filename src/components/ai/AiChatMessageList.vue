<template>
  <section aria-label="AIチャット履歴" class="ai-chat-message-list">
    <p v-if="messages.length === 0" class="ai-chat-message-list__empty">まだチャット履歴はありません。</p>
    <AiChatMessage v-for="message in messages" :key="message.id" :message="message" />
  </section>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { AiChatMessage as AiChatMessageType } from "@/features/ai/aiChatStore";
import AiChatMessage from "@/components/ai/AiChatMessage.vue";

export default defineComponent({
  name: "AiChatMessageList",
  components: {
    AiChatMessage,
  },
  props: {
    messages: {
      required: true,
      type: Array as PropType<AiChatMessageType[]>,
    },
  },
});
</script>

<style scoped>
.ai-chat-message-list {
  display: grid;
  align-content: start;
  gap: var(--space-2);
  height: 100%;
  min-height: 0;
  overflow: auto;
  padding: var(--space-2);
  border-radius: var(--radius-md);
  background: var(--color-surface-inset);
  box-shadow: var(--shadow-inset);
}

.ai-chat-message-list__empty {
  color: var(--color-text-muted);
  font-size: 0.84rem;
}
</style>
