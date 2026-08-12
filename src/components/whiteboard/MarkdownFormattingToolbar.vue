<template>
  <div aria-label="Markdown書式" class="markdown-formatting-toolbar" role="toolbar">
    <AppIconButton
      v-for="item in actions"
      :key="item.action"
      :disabled="disabled"
      :icon="item.icon"
      :label="item.label"
      :tooltip="item.label"
      @click="$emit('format', item.action)"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import type { MarkdownFormatAction } from "@/features/whiteboard/markdownFormatting";
import AppIconButton from "@/components/ui/AppIconButton.vue";

interface FormattingAction {
  action: MarkdownFormatAction;
  icon: string;
  label: string;
}

const actions: FormattingAction[] = [
  { action: "bold", icon: "format_bold", label: "太字" },
  { action: "italic", icon: "format_italic", label: "斜体" },
  { action: "underline", icon: "format_underlined", label: "下線" },
  { action: "strikethrough", icon: "strikethrough_s", label: "取り消し線" },
  { action: "quote", icon: "format_quote", label: "引用" },
  { action: "code-block", icon: "code_blocks", label: "コードブロック" },
];

export default defineComponent({
  name: "MarkdownFormattingToolbar",
  components: { AppIconButton },
  props: {
    disabled: {
      default: false,
      type: Boolean,
    },
  },
  emits: {
    format: (action: MarkdownFormatAction) => actions.some((item) => item.action === action),
  },
  setup() {
    return { actions };
  },
});
</script>

<style scoped>
.markdown-formatting-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.markdown-formatting-toolbar :deep(.app-icon-button) {
  height: 32px;
  min-width: 32px;
  width: 32px;
}
</style>
