<template>
  <section aria-label="ページサムネイル" class="thumbnail-strip">
    <button
      v-for="page in pages"
      :key="page"
      class="thumbnail-strip__item"
      :class="{ 'thumbnail-strip__item--selected': page === selectedPage }"
      type="button"
      @click="$emit('select-page', page)"
    >
      <span class="thumbnail-strip__paper" />
      <span>{{ page }}</span>
    </button>
  </section>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

export default defineComponent({
  name: "PageThumbnailStrip",
  props: {
    pages: {
      required: true,
      type: Array as PropType<number[]>,
    },
    selectedPage: {
      required: true,
      type: Number,
    },
  },
  emits: ["select-page"],
});
</script>

<style scoped>
.thumbnail-strip {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: var(--space-2);
  min-width: 0;
}

.thumbnail-strip__item {
  display: grid;
  gap: 0.25rem;
  justify-items: center;
  border: 0;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.thumbnail-strip__paper {
  width: 100%;
  aspect-ratio: 3 / 4;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xs);
  background:
    linear-gradient(var(--color-border), var(--color-border)) 35% 35% / 50% 1px no-repeat,
    linear-gradient(var(--color-border), var(--color-border)) 50% 55% / 66% 1px no-repeat,
    white;
}

.thumbnail-strip__item--selected .thumbnail-strip__paper {
  border-color: var(--color-blue);
  box-shadow: var(--shadow-focus);
}
</style>
