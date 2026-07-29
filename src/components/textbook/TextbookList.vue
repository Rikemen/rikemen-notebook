<template>
  <section aria-label="アップロード済みの資料" class="textbook-list">
    <button
      v-for="textbook in textbooks"
      :key="textbook.id"
      class="textbook-list__item"
      :class="{ 'textbook-list__item--selected': textbook.id === selectedId }"
      type="button"
      @click="$emit('select', textbook.id)"
    >
      <span class="textbook-list__icon">PDF</span>
      <span>
        <strong>{{ textbook.title }}</strong>
        <small>{{ textbook.sizeLabel }}・{{ textbook.uploadedAt }}</small>
      </span>
    </button>
  </section>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { MaterialListItem } from "@/features/textbook/materials";

export default defineComponent({
  name: "TextbookList",
  props: {
    selectedId: {
      required: true,
      type: String,
    },
    textbooks: {
      required: true,
      type: Array as PropType<MaterialListItem[]>,
    },
  },
  emits: ["select"],
});
</script>

<style scoped>
.textbook-list {
  display: grid;
  gap: var(--space-2);
  min-width: 0;
}

.textbook-list__item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  min-width: 0;
  padding: var(--space-2);
  border: 1px solid transparent;
  border-left: 3px solid transparent;
  border-radius: var(--radius-md);
  background: var(--color-panel);
  color: var(--color-text);
  text-align: left;
}

.textbook-list__item--selected {
  border-color: var(--color-border);
  border-left-color: var(--color-blue);
  box-shadow: var(--shadow-inset);
}

.textbook-list__icon {
  border-radius: var(--radius-xs);
  background: var(--color-red);
  color: white;
  font-size: 0.66rem;
  font-weight: 800;
  padding: 0.25rem 0.3rem;
}

.textbook-list strong,
.textbook-list small {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.textbook-list small {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}
</style>
