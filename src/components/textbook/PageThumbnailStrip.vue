<template>
  <section aria-label="ページサムネイル" class="thumbnail-strip">
    <div class="thumbnail-strip__grid">
      <button
        v-for="page in visiblePages"
        :key="page"
        class="thumbnail-strip__item"
        :class="{ 'thumbnail-strip__item--selected': page === selectedPage }"
        :aria-current="page === selectedPage ? 'page' : undefined"
        :data-testid="`thumbnail-page-${page}`"
        type="button"
        @click="$emit('select-page', page)"
      >
        <PdfPageThumbnail class="thumbnail-strip__paper" :page="page" :pdf-document="pdfDocument" />
        <span>{{ page }}</span>
      </button>
    </div>
    <nav v-if="totalGroups > 1" aria-label="サムネイルページ切り替え" class="thumbnail-strip__pagination">
      <button
        aria-label="前のサムネイルページ"
        :disabled="currentGroup === 1"
        type="button"
        @click="showPreviousGroup"
      >
        前へ
      </button>
      <span data-testid="thumbnail-pagination-status" aria-live="polite">
        {{ currentGroup }} / {{ totalGroups }}
      </span>
      <button
        aria-label="次のサムネイルページ"
        :disabled="currentGroup === totalGroups"
        type="button"
        @click="showNextGroup"
      >
        次へ
      </button>
    </nav>
  </section>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch, type PropType } from "vue";
import PdfPageThumbnail from "@/components/textbook/PdfPageThumbnail.vue";
import type { LoadedPdfDocument } from "@/features/textbook/pdfDocument";

const THUMBNAILS_PER_GROUP = 12;

const groupForPage = (page: number) => Math.floor((Math.max(page, 1) - 1) / THUMBNAILS_PER_GROUP) + 1;

const clampGroup = (group: number, totalGroups: number) => Math.min(Math.max(group, 1), totalGroups);

export default defineComponent({
  name: "PageThumbnailStrip",
  components: { PdfPageThumbnail },
  props: {
    pdfDocument: {
      default: null,
      type: Object as PropType<LoadedPdfDocument | null>,
    },
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
  setup(props) {
    const currentGroup = ref(1);
    const totalGroups = computed(() => Math.max(Math.ceil(props.pages.length / THUMBNAILS_PER_GROUP), 1));
    const visiblePages = computed(() => {
      const startIndex = (currentGroup.value - 1) * THUMBNAILS_PER_GROUP;
      return props.pages.slice(startIndex, startIndex + THUMBNAILS_PER_GROUP);
    });

    watch(
      () => [props.selectedPage, props.pages.length, props.pdfDocument] as const,
      ([selectedPage]) => {
        currentGroup.value = clampGroup(groupForPage(selectedPage), totalGroups.value);
      },
      { immediate: true },
    );

    const showPreviousGroup = () => {
      currentGroup.value = clampGroup(currentGroup.value - 1, totalGroups.value);
    };
    const showNextGroup = () => {
      currentGroup.value = clampGroup(currentGroup.value + 1, totalGroups.value);
    };

    return {
      currentGroup,
      showNextGroup,
      showPreviousGroup,
      totalGroups,
      visiblePages,
    };
  },
});
</script>

<style scoped>
.thumbnail-strip {
  display: grid;
  gap: var(--space-2);
  min-width: 0;
}

.thumbnail-strip__grid {
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
}

.thumbnail-strip__item--selected .thumbnail-strip__paper {
  border-color: var(--color-blue);
  box-shadow: var(--shadow-focus);
}

.thumbnail-strip__pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.thumbnail-strip__pagination button {
  min-height: 2rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xs);
  background: var(--color-surface);
  color: var(--color-blue);
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 700;
  padding: var(--space-1) var(--space-2);
}

.thumbnail-strip__pagination button:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);
}

.thumbnail-strip__pagination button:disabled {
  cursor: default;
  opacity: 0.45;
}
</style>
