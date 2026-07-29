<template>
  <div class="p5-runtime-preview">
    <iframe
      v-if="srcdoc && runId"
      ref="runtimeFrame"
      :srcdoc="srcdoc"
      sandbox="allow-scripts"
      title="p5.jsスケッチ実行結果"
    />
    <p v-else class="p5-runtime-preview__empty">スケッチは停止しています。</p>
  </div>
</template>

<script lang="ts">
import { defineComponent, onBeforeUnmount, onMounted, ref } from "vue";

interface RuntimeMessage {
  message?: string;
  runId?: string;
  source?: string;
  type?: string;
}

export default defineComponent({
  name: "P5RuntimePreview",
  props: {
    runId: {
      required: true,
      type: String,
    },
    srcdoc: {
      required: true,
      type: String,
    },
  },
  emits: ["ready", "runtime-error"],
  setup(props, { emit }) {
    const runtimeFrame = ref<HTMLIFrameElement>();
    const handleRuntimeMessage = (event: MessageEvent<RuntimeMessage>) => {
      const message = event.data;
      const expectedSource: MessageEventSource | null = runtimeFrame.value?.contentWindow ?? null;
      if (
        event.source !== expectedSource ||
        message?.source !== "gauss-p5-runtime" ||
        message.runId !== props.runId
      ) {
        return;
      }
      if (message.type === "ready") {
        emit("ready");
      }
      if (message.type === "error") {
        emit("runtime-error", message.message || "スケッチの実行中にエラーが発生しました。");
      }
    };

    onMounted(() => window.addEventListener("message", handleRuntimeMessage));
    onBeforeUnmount(() => window.removeEventListener("message", handleRuntimeMessage));

    return {
      runtimeFrame,
    };
  },
});
</script>

<style scoped>
.p5-runtime-preview {
  display: grid;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border-radius: var(--radius-sm);
  background: #fff;
  box-shadow: var(--shadow-inset);
}

.p5-runtime-preview iframe {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  border: 0;
  background: #fff;
}

.p5-runtime-preview__empty {
  place-self: center;
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.82rem;
}
</style>
