<template>
  <section aria-label="選択中画像プレビュー" class="image-material-preview">
    <h3>{{ title }}</h3>
    <div v-if="sourceUrl" class="image-material-preview__surface">
      <img :alt="title" :src="sourceUrl" />
    </div>
    <p v-else>プレビューする画像を選択してください。</p>
  </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "ImageMaterialPreview",
  props: {
    sourceUrl: { default: "", type: String },
    title: { required: true, type: String },
  },
});
</script>

<style scoped>
.image-material-preview {
  display: grid;
  gap: var(--space-3);
  min-height: 0;
}

.image-material-preview h3,
.image-material-preview p {
  margin: 0;
}

.image-material-preview__surface {
  align-items: center;
  background: var(--color-surface-inset);
  border-radius: var(--radius-md);
  display: flex;
  justify-content: center;
  min-height: 0;
  overflow: auto;
  padding: var(--space-3);
}

.image-material-preview img {
  display: block;
  height: auto;
  max-height: 100%;
  max-width: 100%;
  object-fit: contain;
}
</style>
