<template>
  <article class="ai-chat-message" :class="messageClass">
    <strong>{{ roleLabel }}</strong>
    <p>
      <template v-for="(segment, index) in segments" :key="index">
        <MathRenderer v-if="segment.kind === 'math'" :expression="segment.expression" />
        <span v-else>{{ segment.text }}</span>
      </template>
    </p>
  </article>
</template>

<script lang="ts">
import { computed, defineComponent, type PropType } from "vue";
import type { AiChatMessage as AiChatMessageType } from "@/features/ai/aiChatStore";
import { splitMathSegments } from "@/features/math/mathSegments";
import MathRenderer from "@/components/math/MathRenderer.vue";

export default defineComponent({
  name: "AiChatMessage",
  components: {
    MathRenderer,
  },
  props: {
    message: {
      required: true,
      type: Object as PropType<AiChatMessageType>,
    },
  },
  setup(props) {
    const roleLabel = computed(() => {
      if (props.message.role === "user") {
        return "自分";
      }

      return "AI";
    });
    const messageClass = computed(() => `ai-chat-message--${props.message.role}`);
    const segments = computed(() => splitMathSegments(props.message.text));

    return {
      messageClass,
      roleLabel,
      segments,
    };
  },
});
</script>

<style scoped>
.ai-chat-message {
  display: grid;
  gap: var(--space-1);
  max-width: 92%;
  padding: var(--space-2);
  border-radius: var(--radius-md);
  background: var(--color-surface-strong);
  box-shadow: var(--shadow-raised-sm);
}

.ai-chat-message--user {
  justify-self: end;
  background: var(--color-blue-soft);
}

.ai-chat-message strong {
  color: var(--color-text-secondary);
  font-size: 0.75rem;
}

.ai-chat-message p {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 0.85rem;
  line-height: 1.7;
}
</style>

