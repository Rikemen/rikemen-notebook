<template>
  <div
    class="ai-chat-history-dialog"
    role="dialog"
    aria-modal="true"
    aria-labelledby="ai-chat-history-title"
    @click.self="$emit('close')"
  >
    <section class="ai-chat-history-dialog__panel">
      <header class="ai-chat-history-dialog__header">
        <h3 id="ai-chat-history-title">チャット履歴</h3>
        <AppIconButton icon="close" label="履歴を閉じる" @click="$emit('close')" />
      </header>
      <div class="ai-chat-history-dialog__list">
        <p v-if="threads.length === 0" class="ai-chat-history-dialog__empty">チャット履歴はありません。</p>
        <button
          v-for="thread in threads"
          :key="thread.id"
          class="ai-chat-history-dialog__item"
          :aria-current="thread.id === activeThreadId"
          :data-thread-id="thread.id"
          type="button"
          @click="$emit('select', thread.id)"
        >
          <strong>{{ thread.title }}</strong>
          <span>{{ thread.turnCount }} / 30ターン</span>
          <time :datetime="thread.updatedAt">{{ formatDate(thread.updatedAt) }}</time>
        </button>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent, onBeforeUnmount, onMounted, type PropType } from "vue";
import type { AiChatThread } from "@/features/ai/types";
import AppIconButton from "@/components/ui/AppIconButton.vue";

export default defineComponent({
  name: "AiChatHistoryDialog",
  components: {
    AppIconButton,
  },
  props: {
    activeThreadId: {
      default: "",
      type: String,
    },
    threads: {
      required: true,
      type: Array as PropType<AiChatThread[]>,
    },
  },
  emits: {
    close: () => true,
    select: (__threadId: string) => true,
  },
  setup(__props, { emit }) {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        emit("close");
      }
    };
    const formatDate = (date: string) =>
      new Intl.DateTimeFormat("ja-JP", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(date));

    onMounted(() => window.addEventListener("keydown", closeOnEscape));
    onBeforeUnmount(() => window.removeEventListener("keydown", closeOnEscape));

    return {
      formatDate,
    };
  },
});
</script>

<style scoped>
.ai-chat-history-dialog {
  position: fixed;
  z-index: 100;
  inset: 0;
  display: grid;
  place-items: center;
  box-sizing: border-box;
  background: rgba(23, 26, 32, 0.25);
  padding: var(--space-4);
}

.ai-chat-history-dialog__panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: var(--space-3);
  width: min(32rem, 100%);
  max-height: min(36rem, calc(100dvh - 2rem));
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-raised);
  padding: var(--space-4);
}

.ai-chat-history-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.ai-chat-history-dialog__header h3,
.ai-chat-history-dialog__empty {
  margin: 0;
}

.ai-chat-history-dialog__list {
  display: grid;
  align-content: start;
  gap: var(--space-2);
  min-height: 0;
  overflow: auto;
}

.ai-chat-history-dialog__item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--space-1) var(--space-3);
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  box-shadow: var(--shadow-raised-sm);
  color: var(--color-text-primary);
  padding: var(--space-3);
  text-align: left;
}

.ai-chat-history-dialog__item[aria-current="true"] {
  box-shadow: var(--shadow-inset);
  color: var(--color-blue);
}

.ai-chat-history-dialog__item strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ai-chat-history-dialog__item span,
.ai-chat-history-dialog__item time,
.ai-chat-history-dialog__empty {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.ai-chat-history-dialog__item time {
  grid-column: 1 / -1;
}
</style>
