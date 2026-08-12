<template>
  <template v-for="(node, index) in nodes" :key="`${node.type}-${index}`">
    <template v-if="node.type === 'text'">{{ node.text }}</template>
    <strong v-else-if="node.type === 'strong'">
      <MarkdownInlineContent :nodes="node.children" />
    </strong>
    <em v-else-if="node.type === 'emphasis'">
      <MarkdownInlineContent :nodes="node.children" />
    </em>
    <u v-else-if="node.type === 'underline'">
      <MarkdownInlineContent :nodes="node.children" />
    </u>
    <del v-else>
      <MarkdownInlineContent :nodes="node.children" />
    </del>
  </template>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { MarkdownInlineNode } from "@/features/whiteboard/markdownPreview";

export default defineComponent({
  name: "MarkdownInlineContent",
  props: {
    nodes: {
      required: true,
      type: Array as PropType<MarkdownInlineNode[]>,
    },
  },
});
</script>
