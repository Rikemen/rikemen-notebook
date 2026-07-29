<template>
  <section aria-label="選択中ページプレビュー" class="textbook-preview">
    <h3>{{ textbookTitle }}・{{ page }}ページ</h3>
    <div class="textbook-preview__page">
      <p class="textbook-preview__heading">2.1 関数の極限</p>
      <p>定義 1 実数 x が a に近づくとき、関数 f(x) が L に近づく。</p>
      <p class="textbook-preview__formula">f(x) = lim h→0 (f(x+h)-f(x))/h</p>
      <div class="textbook-preview__graph" aria-hidden="true" />
      <small>図 1: 平均変化の概念</small>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "TextbookPreview",
  props: {
    textbookTitle: {
      required: true,
      type: String,
    },
    page: {
      required: true,
      type: Number,
    },
  },
});
</script>

<style scoped>
.textbook-preview {
  height: 100%;
  min-height: 0;
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

.textbook-preview__page {
  min-height: 210px;
  max-width: 100%;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: white;
  box-shadow: var(--shadow-inset);
  color: var(--color-text);
  font-size: 0.8rem;
  overflow: hidden;
}

.textbook-preview__heading {
  font-weight: 800;
  text-align: center;
}

.textbook-preview__formula {
  color: var(--color-text);
  font-family: Georgia, "Times New Roman", serif;
}

.textbook-preview__graph {
  height: 64px;
  margin: var(--space-3) auto;
  max-width: 190px;
  border-bottom: 1px solid var(--color-text);
  border-left: 1px solid var(--color-text);
  background:
    linear-gradient(145deg, transparent 46%, var(--color-blue) 47%, var(--color-blue) 49%, transparent 50%),
    linear-gradient(20deg, transparent 48%, #94a3b8 49%, #94a3b8 51%, transparent 52%);
}
</style>
