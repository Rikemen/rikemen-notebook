<template>
  <div class="ai-chat-panel">
    <div v-if="currentUser" class="ai-chat-panel__toolbar" role="toolbar" aria-label="AIチャット操作">
      <AppIconButton icon="add_comment" label="新しいチャット" @click="createThread" />
      <AppIconButton icon="history" label="チャット履歴" @click="historyOpen = true" />
    </div>
    <p v-if="!currentUser" class="ai-chat-panel__notice">AI機能の利用にはログインが必要です。</p>
    <p v-else class="ai-chat-panel__quota">ログイン中は100回/日までチャットできます。</p>
    <aside v-if="activeThread?.inheritedSummary" class="ai-chat-panel__summary">
      <strong>前のチャットの要約</strong>
      <p>{{ activeThread.inheritedSummary }}</p>
    </aside>
    <AiChatMessageList :messages="messages" />
    <AiQuickActions v-if="!isFull" @select="useQuickAction" />
    <button
      v-if="isFull"
      class="ai-chat-panel__rollover"
      :disabled="activeThread?.status === 'summarizing'"
      type="button"
      @click="rollover"
    >
      要約して新しいチャットへ
    </button>
    <AiChatComposer v-model="prompt" :disabled="!currentUser || isFull" @submit="send" />
    <p v-if="store.errorMessage" class="ai-chat-panel__error">{{ store.errorMessage }}</p>
    <AiChatHistoryDialog
      v-if="historyOpen && currentUser"
      :active-thread-id="activeThread?.id ?? ''"
      :threads="threads"
      @close="historyOpen = false"
      @select="selectHistory"
    />
  </div>
</template>

<script lang="ts">
/* eslint-disable max-lines-per-function, max-statements, no-ternary */
import { computed, defineComponent, onMounted, ref, type PropType, watch } from "vue";
import type { AuthUser } from "@/features/auth/types";
import { createFixedAiClient } from "@/features/ai/aiClient";
import { createFunctionsOpenAiClient } from "@/features/ai/functionsOpenAiClient";
import { useAiChatStore } from "@/features/ai/aiChatStore";
import { callMathChatMessage } from "@/utils/functions";
import AiChatComposer from "@/components/ai/AiChatComposer.vue";
import AiChatHistoryDialog from "@/components/ai/AiChatHistoryDialog.vue";
import AiChatMessageList from "@/components/ai/AiChatMessageList.vue";
import AiQuickActions from "@/components/ai/AiQuickActions.vue";
import AppIconButton from "@/components/ui/AppIconButton.vue";

export default defineComponent({
  name: "AiChatPanel",
  components: {
    AiChatComposer,
    AiChatHistoryDialog,
    AiChatMessageList,
    AiQuickActions,
    AppIconButton,
  },
  props: {
    currentUser: {
      default: null,
      type: Object as PropType<AuthUser | null>,
    },
    noteId: {
      required: true,
      type: String,
    },
  },
  setup(props) {
    const store = useAiChatStore();
    const client = import.meta.env.MODE === "test"
      ? createFixedAiClient()
      : createFunctionsOpenAiClient(callMathChatMessage, { noteId: props.noteId });
    const historyOpen = ref(false);

    const ensureThread = () => {
      if (props.currentUser) {
        store.ensureActiveThread(props.currentUser, props.noteId);
      }
    };
    ensureThread();

    const activeThread = computed(() =>
      props.currentUser ? store.activeThreadForNote(props.currentUser.uid, props.noteId) : undefined,
    );
    const threads = computed(() =>
      props.currentUser ? store.threadsForNote(props.currentUser.uid, props.noteId) : [],
    );
    const messages = computed(() => {
      if (!props.currentUser || !activeThread.value) {
        return [];
      }
      return store.messagesForThread(props.currentUser.uid, props.noteId, activeThread.value.id);
    });
    const prompt = computed({
      get: () => {
        if (!props.currentUser || !activeThread.value) {
          return "";
        }
        return store.draftForThread(props.currentUser.uid, props.noteId, activeThread.value.id);
      },
      set: (draft: string) => {
        if (props.currentUser && activeThread.value) {
          store.setDraft(props.currentUser.uid, props.noteId, activeThread.value.id, draft);
        }
      },
    });
    const isFull = computed(
      () => activeThread.value?.status === "full" || activeThread.value?.status === "summarizing",
    );

    const sendText = async (text: string) => {
      if (!text) {
        return;
      }
      const sentThreadId = activeThread.value?.id;
      const sent = await store.sendMessage({
        client,
        noteId: props.noteId,
        prompt: text,
        user: props.currentUser,
      });
      if (sent && props.currentUser && sentThreadId) {
        store.clearDraft(props.currentUser.uid, props.noteId, sentThreadId);
      }
    };
    const send = async (submittedPrompt: string) => {
      await sendText(submittedPrompt.trim());
    };
    const useQuickAction = (action: string) => {
      prompt.value = action;
    };
    const createThread = async () => {
      if (props.currentUser) {
        await store.createAndSaveNewThread(props.currentUser, props.noteId);
      }
    };
    const selectHistory = async (threadId: string) => {
      if (props.currentUser) {
        await store.selectThread(props.currentUser, props.noteId, threadId);
      }
      historyOpen.value = false;
    };
    const rollover = async () => {
      if (props.currentUser) {
        await store.rolloverThread({
          client,
          noteId: props.noteId,
          user: props.currentUser,
        });
      }
    };

    watch(
      () => [props.currentUser?.uid, props.noteId],
      () => ensureThread(),
    );
    onMounted(async () => {
      if (props.currentUser) {
        await store.loadThreads(props.currentUser, props.noteId);
      }
    });

    return {
      activeThread,
      createThread,
      historyOpen,
      isFull,
      messages,
      prompt,
      rollover,
      selectHistory,
      send,
      store,
      threads,
      useQuickAction,
    };
  },
});
</script>

<style scoped>
.ai-chat-panel {
  display: grid;
  grid-template-rows: auto auto auto minmax(0, 1fr) auto auto auto;
  gap: var(--space-3);
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.ai-chat-panel__toolbar {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}

.ai-chat-panel__notice,
.ai-chat-panel__error {
  margin: 0;
  border-radius: var(--radius-md);
  background: var(--color-red-soft);
  color: var(--color-red);
  font-size: 0.82rem;
  padding: var(--space-2);
}

.ai-chat-panel__quota {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.ai-chat-panel__summary {
  border-left: 3px solid var(--color-blue);
  border-radius: var(--radius-sm);
  background: var(--color-blue-soft);
  color: var(--color-text-secondary);
  padding: var(--space-2) var(--space-3);
}

.ai-chat-panel__summary p {
  margin: var(--space-1) 0 0;
  font-size: 0.8rem;
}

.ai-chat-panel__rollover {
  min-height: 2.4rem;
  border-radius: var(--radius-sm);
  background: var(--color-blue);
  color: white;
  font-weight: 700;
  padding: 0 var(--space-3);
}
</style>
