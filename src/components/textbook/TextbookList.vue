<template>
  <section aria-label="アップロード済みの資料" class="textbook-list">
    <p v-if="textbooks.length === 0" class="textbook-list__empty">PDFを追加してください。画像・ブックマークにも対応しています。</p>
    <template v-for="textbook in textbooks" :key="textbook.id">
      <a v-if="textbook.kind === 'bookmark'" class="textbook-list__item" :href="textbook.url" rel="noopener noreferrer" target="_blank">
        <span class="textbook-list__icon textbook-list__icon--bookmark">URL</span>
        <span>
          <strong>{{ textbook.title }}</strong>
          <small>{{ textbook.url }}</small>
          <small v-if="materialStatusLabel(textbook.status)" class="textbook-list__status">{{ materialStatusLabel(textbook.status) }}</small>
        </span>
      </a>
      <button
        v-else
        :key="textbook.id"
        class="textbook-list__item"
        :class="{ 'textbook-list__item--selected': textbook.id === selectedId }"
        type="button"
        @click="$emit('select', textbook.id)"
      >
        <span class="textbook-list__icon" :class="{ 'textbook-list__icon--image': textbook.kind === 'image' }">{{ materialKindLabel(textbook.kind) }}</span>
        <span>
          <strong>{{ textbook.title }}</strong>
          <small>{{ textbook.sizeLabel }}・{{ textbook.uploadedAt }}</small>
          <small v-if="materialStatusLabel(textbook.status)" class="textbook-list__status">
            {{ materialStatusLabel(textbook.status) }}
          </small>
        </span>
      </button>
    </template>
  </section>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import { materialKindLabel, materialStatusLabel, type MaterialListItem } from "@/features/textbook/materials";

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
  setup() {
    return {
      materialStatusLabel,
      materialKindLabel,
    };
  },
});
</script>

<style scoped>
.textbook-list {
  display: grid;
  gap: var(--space-2);
  min-width: 0;
}

.textbook-list__empty {
  margin: 0;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  font-size: 0.82rem;
  padding: var(--space-4) var(--space-3);
  text-align: center;
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
  text-decoration: none;
}

.textbook-list__icon--bookmark,
.textbook-list__icon--image {
  background: var(--color-blue);
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

.textbook-list__status {
  color: var(--color-blue);
  font-weight: 700;
}

.textbook-list small {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}
</style>
