<template>
  <section ref="previewContainer" aria-label="選択中ページプレビュー" class="textbook-preview">
    <h3>{{ textbookTitle }}・{{ page }}ページ</h3>
    <div v-if="sourceUrl" ref="previewDocument" class="textbook-preview__document">
      <canvas
        v-if="pdfDocument && !renderError"
        ref="canvas"
        :aria-label="`${textbookTitle} ${page}ページ`"
        class="textbook-preview__canvas"
      />
      <p v-if="isRendering" class="textbook-preview__loading" aria-live="polite">ページを表示しています。</p>
      <object
        v-if="!pdfDocument || renderError"
        :key="previewUrl"
        :aria-label="`${textbookTitle} ${page}ページ`"
        class="textbook-preview__fallback"
        :data="previewUrl"
        type="application/pdf"
      >
        <p>
          ブラウザ内でPDFを表示できません。
          <a :href="previewUrl" rel="noopener" target="_blank">PDFを別画面で開く</a>
        </p>
      </object>
    </div>
    <p v-else class="textbook-preview__empty">プレビューするPDFを選択してください。</p>
  </section>
</template>

<script lang="ts">
/* eslint-disable max-lines-per-function, max-statements */
import {
  computed,
  defineComponent,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type PropType,
} from "vue";
import type { LoadedPdfDocument, PdfPageRenderHandle } from "@/features/textbook/pdfDocument";

const FALLBACK_PREVIEW_WIDTH = 720;

export default defineComponent({
  name: "TextbookPreview",
  props: {
    pdfDocument: {
      default: null,
      type: Object as PropType<LoadedPdfDocument | null>,
    },
    textbookTitle: {
      required: true,
      type: String,
    },
    page: {
      required: true,
      type: Number,
    },
    sourceUrl: {
      default: "",
      type: String,
    },
  },
  setup(props) {
    const canvas = ref<HTMLCanvasElement | null>(null);
    const isRendering = ref(false);
    const previewContainer = ref<HTMLElement | null>(null);
    const previewDocument = ref<HTMLElement | null>(null);
    const renderError = ref(false);
    const previewUrl = computed(() => `${props.sourceUrl.split("#")[0]}#page=${props.page}`);
    let observedWidth = 0;
    let activeRender: PdfPageRenderHandle | null = null;
    let renderRequestId = 0;
    let resizeObserver: ResizeObserver | null = null;

    const targetWidth = () => {
      if (observedWidth > 0) {
        return observedWidth;
      }
      return previewDocument.value?.clientWidth || previewContainer.value?.clientWidth || FALLBACK_PREVIEW_WIDTH;
    };

    const renderPage = async () => {
      activeRender?.cancel();
      renderRequestId += 1;
      const requestId = renderRequestId;
      renderError.value = false;
      if (!props.pdfDocument || !canvas.value) {
        isRendering.value = false;
        return;
      }

      isRendering.value = true;
      try {
        const render = await props.pdfDocument.renderPage(canvas.value, props.page, targetWidth());
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
      } finally {
        if (requestId === renderRequestId) {
          isRendering.value = false;
        }
      }
    };

    watch(
      () => [props.pdfDocument, props.page] as const,
      () => {
        nextTick(renderPage).catch(() => undefined);
      },
      { immediate: true },
    );

    onMounted(() => {
      if (typeof globalThis.ResizeObserver !== "function" || !previewDocument.value) {
        return;
      }
      resizeObserver = new ResizeObserver((entries) => {
        const width = Math.round(entries[0]?.contentRect.width ?? 0);
        if (width <= 0 || width === observedWidth) {
          return;
        }
        observedWidth = width;
        nextTick(renderPage).catch(() => undefined);
      });
      resizeObserver.observe(previewDocument.value);
    });

    onBeforeUnmount(() => {
      renderRequestId += 1;
      activeRender?.cancel();
      resizeObserver?.disconnect();
    });

    return {
      canvas,
      isRendering,
      previewContainer,
      previewDocument,
      previewUrl,
      renderError,
    };
  },
});
</script>

<style scoped>
.textbook-preview {
  height: 100%;
  min-height: 0;
  width: 100%;
  overflow: auto;
}

.textbook-preview h3 {
  overflow: hidden;
  margin: 0 0 var(--space-2);
  color: var(--color-text-muted);
  font-size: 0.8rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.textbook-preview__document {
  position: relative;
  display: grid;
  width: 100%;
  min-height: 240px;
  place-items: start center;
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-inset);
  overflow: auto;
}

.textbook-preview__canvas {
  display: block;
  max-width: 100%;
  background: white;
}

.textbook-preview__loading {
  position: absolute;
  inset: var(--space-3) auto auto 50%;
  margin: 0;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.9);
  color: var(--color-text-muted);
  font-size: 0.78rem;
  padding: var(--space-1) var(--space-2);
  transform: translateX(-50%);
}

.textbook-preview__fallback {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 240px;
  border: 0;
  background: white;
}

.textbook-preview__empty {
  margin: 0;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  font-size: 0.82rem;
  padding: var(--space-4) var(--space-3);
  text-align: center;
}
</style>
