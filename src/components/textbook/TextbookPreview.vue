<template>
  <section ref="previewContainer" aria-label="選択中ページプレビュー" class="textbook-preview">
    <header class="textbook-preview__header">
      <h3>{{ textbookTitle }}・{{ page }}ページ</h3>
      <div v-if="canZoom" aria-label="PDFズーム" class="textbook-preview__zoom" role="toolbar">
        <AppIconButton :disabled="zoom <= MIN_MATERIAL_ZOOM" icon="zoom_out" label="PDFを縮小" tooltip="PDFを縮小" @click="zoomOut" />
        <span data-testid="pdf-zoom-status" aria-live="polite">{{ zoomPercent }}%</span>
        <AppIconButton :disabled="zoom >= MAX_MATERIAL_ZOOM" icon="zoom_in" label="PDFを拡大" tooltip="PDFを拡大" @click="zoomIn" />
        <AppIconButton :disabled="zoom === DEFAULT_MATERIAL_ZOOM" icon="restart_alt" label="PDFを100%に戻す" tooltip="PDFを100%に戻す" @click="resetZoom" />
      </div>
    </header>
    <div
      v-if="sourceUrl"
      ref="previewDocument"
      class="textbook-preview__document"
      :class="{ 'textbook-preview__document--zoom-enabled': canZoom }"
      @pointercancel="handlePointerEnd"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerEnd"
    >
      <canvas v-if="effectiveLoadStatus === 'ready' && pdfDocument && !renderError" ref="canvas" :aria-label="`${textbookTitle} ${page}ページ`" class="textbook-preview__canvas" />
      <p v-if="effectiveLoadStatus === 'loading'" class="textbook-preview__loading" aria-live="polite">
        PDFを読み込んでいます<span v-if="loadPercent !== null">（{{ loadPercent }}%）</span>。
      </p>
      <p v-else-if="isRendering" class="textbook-preview__loading" aria-live="polite">ページを表示しています。</p>
      <div v-if="hasPreviewError" class="textbook-preview__error" role="alert">
        <p>PDFを表示できませんでした。</p>
        <div class="textbook-preview__error-actions">
          <button type="button" @click="$emit('retry')">再試行</button>
          <a :href="previewUrl" rel="noopener noreferrer" target="_blank">PDFを別画面で開く</a>
        </div>
      </div>
    </div>
    <p v-else class="textbook-preview__empty">プレビューするPDFを選択してください。</p>
  </section>
</template>

<script lang="ts">
/* eslint-disable max-lines-per-function, max-statements, no-ternary */
import { computed, defineComponent, nextTick, onBeforeUnmount, onMounted, ref, watch, type PropType } from "vue";
import type { LoadedPdfDocument, PdfPageRenderHandle } from "@/features/textbook/pdfDocument";
import type { PdfLoadProgress, PdfLoadStatus } from "@/features/textbook/pdfLoadState";
import {
  calculatePinchZoom,
  clampMaterialZoom,
  decreaseMaterialZoom,
  DEFAULT_MATERIAL_ZOOM,
  increaseMaterialZoom,
  MAX_MATERIAL_ZOOM,
  MIN_MATERIAL_ZOOM,
  resetMaterialZoom,
} from "@/features/textbook/materialPreviewZoom";
import AppIconButton from "@/components/ui/AppIconButton.vue";

const FALLBACK_PREVIEW_WIDTH = 720;
interface PointerPosition {
  clientX: number;
  clientY: number;
}

const distanceBetweenPointers = (pointers: PointerPosition[]) => {
  const [first, second] = pointers;
  if (!first || !second) {
    return 0;
  }
  return Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
};

export default defineComponent({
  name: "TextbookPreview",
  components: { AppIconButton },
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
    loadProgress: {
      default: null,
      type: Object as PropType<PdfLoadProgress | null>,
    },
    loadStatus: {
      default: "idle",
      type: String as PropType<PdfLoadStatus>,
    },
    zoomEnabled: {
      default: true,
      type: Boolean,
    },
  },
  emits: ["retry"],
  setup(props) {
    const canvas = ref<HTMLCanvasElement | null>(null);
    const isRendering = ref(false);
    const previewContainer = ref<HTMLElement | null>(null);
    const previewDocument = ref<HTMLElement | null>(null);
    const renderError = ref(false);
    const zoom = ref(DEFAULT_MATERIAL_ZOOM);
    const canZoom = computed(() => props.zoomEnabled && Boolean(props.pdfDocument));
    const effectiveLoadStatus = computed<PdfLoadStatus>(() => {
      if (props.pdfDocument) return "ready";
      if (props.loadStatus === "error") return "error";
      return props.sourceUrl ? "loading" : "idle";
    });
    const hasPreviewError = computed(() => effectiveLoadStatus.value === "error" || renderError.value);
    const loadPercent = computed(() => props.loadProgress?.ratio === null || props.loadProgress?.ratio === undefined ? null : Math.round(props.loadProgress.ratio * 100));
    const previewUrl = computed(() => `${props.sourceUrl.split("#")[0]}#page=${props.page}`);
    const zoomPercent = computed(() => Math.round(zoom.value * 100));
    let observedWidth = 0;
    let activeRender: PdfPageRenderHandle | null = null;
    let renderRequestId = 0;
    let resizeObserver: ResizeObserver | null = null;
    const activePointers = new Map<number, PointerPosition>();
    let pinchStartDistance = 0;
    let pinchStartZoom = DEFAULT_MATERIAL_ZOOM;

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
        const render = await props.pdfDocument.renderPage(canvas.value, props.page, targetWidth() * zoom.value);
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
      () => [props.pdfDocument, props.page, zoom.value] as const,
      () => {
        nextTick(renderPage).catch(() => undefined);
      },
      { immediate: true },
    );

    const clearPointerState = () => {
      activePointers.clear();
      pinchStartDistance = 0;
      pinchStartZoom = zoom.value;
    };
    const setZoom = (nextZoom: number) => {
      zoom.value = clampMaterialZoom(nextZoom);
    };
    const resetZoom = () => setZoom(resetMaterialZoom());
    const zoomIn = () => setZoom(increaseMaterialZoom(zoom.value));
    const zoomOut = () => setZoom(decreaseMaterialZoom(zoom.value));
    const handlePointerDown = (event: PointerEvent) => {
      if (!canZoom.value) {
        return;
      }
      activePointers.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });
      (event.currentTarget as HTMLElement | null)?.setPointerCapture?.(event.pointerId);
      if (activePointers.size === 2) {
        pinchStartDistance = distanceBetweenPointers([...activePointers.values()]);
        pinchStartZoom = zoom.value;
      }
    };
    const handlePointerMove = (event: PointerEvent) => {
      if (!canZoom.value || !activePointers.has(event.pointerId)) {
        return;
      }
      activePointers.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });
      if (activePointers.size !== 2 || pinchStartDistance <= 0) {
        return;
      }
      event.preventDefault();
      setZoom(calculatePinchZoom(pinchStartZoom, pinchStartDistance, distanceBetweenPointers([...activePointers.values()])));
    };
    const handlePointerEnd = (event: PointerEvent) => {
      activePointers.delete(event.pointerId);
      (event.currentTarget as HTMLElement | null)?.releasePointerCapture?.(event.pointerId);
      if (activePointers.size < 2) {
        pinchStartDistance = 0;
        pinchStartZoom = zoom.value;
      }
    };

    watch(
      () => props.pdfDocument,
      () => {
        clearPointerState();
        resetZoom();
      },
    );
    watch(
      () => props.zoomEnabled,
      (enabled) => {
        if (!enabled) {
          clearPointerState();
          resetZoom();
        }
      },
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
      clearPointerState();
    });

    return {
      canZoom,
      canvas,
      effectiveLoadStatus,
      handlePointerDown,
      handlePointerEnd,
      handlePointerMove,
      hasPreviewError,
      isRendering,
      loadPercent,
      DEFAULT_MATERIAL_ZOOM,
      MAX_MATERIAL_ZOOM,
      MIN_MATERIAL_ZOOM,
      previewContainer,
      previewDocument,
      previewUrl,
      renderError,
      resetZoom,
      zoom,
      zoomIn,
      zoomOut,
      zoomPercent,
    };
  },
});
</script>

<style scoped src="../../styles/components/textbook-preview.css"></style>
