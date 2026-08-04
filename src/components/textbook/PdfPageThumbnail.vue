<template>
  <span ref="thumbnail" class="pdf-page-thumbnail" :class="{ 'pdf-page-thumbnail--error': renderError }">
    <canvas v-if="pdfDocument" ref="canvas" :aria-label="`${page}ページのサムネイル`" />
  </span>
</template>

<script lang="ts">
/* eslint-disable max-lines-per-function, max-statements */
import {
  defineComponent,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type PropType,
} from "vue";
import type { LoadedPdfDocument, PdfPageRenderHandle } from "@/features/textbook/pdfDocument";

const FALLBACK_THUMBNAIL_WIDTH = 96;

export default defineComponent({
  name: "PdfPageThumbnail",
  props: {
    page: {
      required: true,
      type: Number,
    },
    pdfDocument: {
      default: null,
      type: Object as PropType<LoadedPdfDocument | null>,
    },
  },
  setup(props) {
    const canvas = ref<HTMLCanvasElement | null>(null);
    const isVisible = ref(typeof globalThis.IntersectionObserver !== "function");
    const renderError = ref(false);
    const thumbnail = ref<HTMLElement | null>(null);
    let activeRender: PdfPageRenderHandle | null = null;
    let observer: IntersectionObserver | null = null;
    let renderRequestId = 0;

    const renderPage = async () => {
      if (!isVisible.value || !props.pdfDocument || !canvas.value) {
        return;
      }

      activeRender?.cancel();
      renderRequestId += 1;
      const requestId = renderRequestId;
      renderError.value = false;
      try {
        const targetWidth = thumbnail.value?.clientWidth || FALLBACK_THUMBNAIL_WIDTH;
        const render = await props.pdfDocument.renderPage(canvas.value, props.page, targetWidth);
        if (requestId !== renderRequestId) {
          render.cancel();
          await render.promise.catch(() => undefined);
          return;
        }
        // The request id check above prevents an older async render from winning this assignment.
        // eslint-disable-next-line require-atomic-updates
        activeRender = render;
        await render.promise;
      } catch {
        if (requestId === renderRequestId) {
          renderError.value = true;
        }
      }
    };

    watch(
      () => [props.pdfDocument, props.page, isVisible.value] as const,
      () => {
        nextTick(renderPage).catch(() => undefined);
      },
      { immediate: true },
    );

    onMounted(() => {
      if (typeof globalThis.IntersectionObserver !== "function" || !thumbnail.value) {
        isVisible.value = true;
        return;
      }

      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          isVisible.value = true;
          observer?.disconnect();
        }
      });
      observer.observe(thumbnail.value);
    });

    onBeforeUnmount(() => {
      renderRequestId += 1;
      activeRender?.cancel();
      observer?.disconnect();
    });

    return {
      canvas,
      renderError,
      thumbnail,
    };
  },
});
</script>

<style scoped>
.pdf-page-thumbnail {
  display: grid;
  width: 100%;
  aspect-ratio: 3 / 4;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xs);
  background: white;
  overflow: hidden;
}

.pdf-page-thumbnail canvas {
  display: block;
  max-width: 100%;
  max-height: 100%;
}

.pdf-page-thumbnail--error {
  background:
    linear-gradient(var(--color-border), var(--color-border)) 35% 35% / 50% 1px no-repeat,
    linear-gradient(var(--color-border), var(--color-border)) 50% 55% / 66% 1px no-repeat,
    white;
}
</style>
