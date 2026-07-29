<template>
  <li class="material-toc-tree-item" role="treeitem">
    <button
      :data-testid="`toc-item-${item.id}`"
      :aria-current="item.page === selectedPage ? 'page' : undefined"
      type="button"
      @click="$emit('navigate', item)"
    >
      <span>{{ item.title }}</span>
      <small>p.{{ item.page }}</small>
    </button>
    <ul v-if="item.children.length > 0" role="group">
      <MaterialTocTreeItem
        v-for="child in item.children"
        :key="child.id"
        :item="child"
        :selected-page="selectedPage"
        @navigate="$emit('navigate', $event)"
      />
    </ul>
  </li>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { MaterialTocItem } from "@/features/textbook/materialTableOfContents";

export default defineComponent({
  name: "MaterialTocTreeItem",
  props: {
    item: {
      required: true,
      type: Object as PropType<MaterialTocItem>,
    },
    selectedPage: {
      required: true,
      type: Number,
    },
  },
  emits: ["navigate"],
});
</script>

<style scoped>
.material-toc-tree-item,
.material-toc-tree-item ul {
  display: grid;
  gap: var(--space-1);
  margin: 0;
  padding: 0;
  list-style: none;
}

.material-toc-tree-item ul {
  padding-left: var(--space-3);
}

.material-toc-tree-item button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  width: 100%;
  min-height: 40px;
  min-width: 0;
  padding: var(--space-2);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text);
  text-align: left;
}

.material-toc-tree-item button[aria-current="page"] {
  border-color: var(--color-border);
  box-shadow: var(--shadow-inset);
  color: var(--color-blue);
}

.material-toc-tree-item button span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.material-toc-tree-item small {
  flex: 0 0 auto;
  color: var(--color-text-muted);
}
</style>
