<template>
  <section aria-label="選択中画像プレビュー" class="image-material-preview">
    <header class="image-material-preview__header">
      <h3>{{ title }}</h3>
      <div v-if="sourceUrl" aria-label="画像ズーム" class="image-material-preview__zoom" role="toolbar">
        <AppIconButton :disabled="zoom <= MIN_MATERIAL_ZOOM" icon="zoom_out" label="画像を縮小" tooltip="画像を縮小" @click="zoomOut" />
        <span data-testid="image-zoom-status" aria-live="polite">{{ zoomPercent }}%</span>
        <AppIconButton :disabled="zoom >= MAX_MATERIAL_ZOOM" icon="zoom_in" label="画像を拡大" tooltip="画像を拡大" @click="zoomIn" />
        <AppIconButton :disabled="zoom === DEFAULT_MATERIAL_ZOOM" icon="restart_alt" label="画像を100%に戻す" tooltip="画像を100%に戻す" @click="resetZoom" />
      </div>
    </header>
    <div v-if="sourceUrl" class="image-material-preview__surface">
      <div
        class="image-material-preview__stage"
        :class="{ 'image-material-preview__stage--reduced': zoom <= DEFAULT_MATERIAL_ZOOM }"
        data-testid="image-zoom-stage"
        :style="zoomStyle"
      >
        <img :alt="title" :src="sourceUrl" />
      </div>
    </div>
    <p v-else>プレビューする画像を選択してください。</p>
  </section>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from "vue";
import {
  decreaseMaterialZoom,
  DEFAULT_MATERIAL_ZOOM,
  increaseMaterialZoom,
  MAX_MATERIAL_ZOOM,
  MIN_MATERIAL_ZOOM,
  resetMaterialZoom,
} from "@/features/textbook/materialPreviewZoom";
import AppIconButton from "@/components/ui/AppIconButton.vue";

export default defineComponent({
  name: "ImageMaterialPreview",
  components: { AppIconButton },
  props: {
    sourceUrl: { default: "", type: String },
    title: { required: true, type: String },
  },
  setup(props) {
    const zoom = ref(DEFAULT_MATERIAL_ZOOM);
    const zoomPercent = computed(() => Math.round(zoom.value * 100));
    const zoomStyle = computed(() => ({
      height: `${zoomPercent.value}%`,
      width: `${zoomPercent.value}%`,
    }));
    const resetZoom = () => {
      zoom.value = resetMaterialZoom();
    };
    const zoomIn = () => {
      zoom.value = increaseMaterialZoom(zoom.value);
    };
    const zoomOut = () => {
      zoom.value = decreaseMaterialZoom(zoom.value);
    };

    watch(() => props.sourceUrl, resetZoom);

    return {
      DEFAULT_MATERIAL_ZOOM,
      MAX_MATERIAL_ZOOM,
      MIN_MATERIAL_ZOOM,
      resetZoom,
      zoom,
      zoomIn,
      zoomOut,
      zoomPercent,
      zoomStyle,
    };
  },
});
</script>

<style scoped>
.image-material-preview {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: var(--space-2);
  height: 100%;
  min-height: 0;
  min-width: 0;
}

.image-material-preview h3,
.image-material-preview p {
  margin: 0;
}

.image-material-preview__header,
.image-material-preview__zoom {
  align-items: center;
  display: flex;
  gap: var(--space-2);
}

.image-material-preview__header {
  justify-content: space-between;
  min-width: 0;
}

.image-material-preview h3 {
  color: var(--color-text-muted);
  flex: 1;
  font-size: 0.8rem;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-material-preview__zoom {
  color: var(--color-text-muted);
  flex: 0 0 auto;
  font-size: 0.75rem;
  gap: var(--space-1);
}

.image-material-preview__zoom :deep(.app-icon-button) {
  height: 32px;
  min-width: 32px;
  width: 32px;
}

.image-material-preview__surface {
  background: var(--color-surface-inset);
  border-radius: var(--radius-md);
  height: 100%;
  min-height: 0;
  min-width: 0;
  overflow: auto;
  padding: var(--space-2);
}

.image-material-preview__stage {
  align-items: center;
  display: flex;
  justify-content: center;
  max-width: none;
  transform-origin: left top;
}

.image-material-preview__stage--reduced {
  margin: auto;
}

.image-material-preview img {
  display: block;
  height: 100%;
  max-height: none;
  max-width: none;
  object-fit: contain;
  width: 100%;
}
</style>
