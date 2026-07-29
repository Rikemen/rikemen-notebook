<template>
  <section class="mx-auto grid max-w-5xl gap-6 px-4 py-10 text-left">
    <div class="ui-raised rounded-[var(--radius-lg)] p-8">
      <p class="text-sm font-semibold text-[var(--color-blue)]">{{ appName }}</p>
      <h1 class="mt-3 text-3xl font-bold text-[var(--color-text-primary)]">資料、ノート、AI、図表を一つの机にまとめます</h1>
      <p class="mt-4 max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)]">
        未ログインではアプリの使い方を確認できます。保存、履歴、AI機能、5GBアップロードを使うにはGoogleアカウントで登録またはログインしてください。
      </p>
      <div class="mt-6 flex flex-wrap gap-3">
        <router-link class="rounded-[var(--radius-sm)] bg-[var(--color-blue)] px-4 py-2 text-white" to="/signup">新規登録</router-link>
        <router-link class="ui-raised rounded-[var(--radius-sm)] px-4 py-2 text-[var(--color-text-primary)]" to="/login">ログイン</router-link>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <article v-for="item in guideItems" :key="item.title" class="ui-raised rounded-[var(--radius-md)] p-5">
        <h2 class="text-base font-bold text-[var(--color-text-primary)]">{{ item.title }}</h2>
        <p class="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{{ item.description }}</p>
      </article>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { APP_NAME } from "@/config/appBrand";

const guideItems = [
  {
    description: "PDF教材を置き、ページを見ながらノートへ引用するための場所です。",
    title: "資料",
  },
  {
    description: "Markdownでノートを書き、必要な箇所に手書き画像を埋め込めます。",
    title: "ホワイトボード",
  },
  {
    description: "ログイン後に使えます。質問や固定応答から始め、OpenAI API連携へ拡張します。",
    title: "AIチャット",
  },
  {
    description: "p5.js風のコードを書き、グラフや図表のCanvas表示を確認します。",
    title: "スケッチ",
  },
];

export default defineComponent({
  name: "HomeUsageGuide",
  setup() {
    return {
      appName: APP_NAME,
      guideItems,
    };
  },
});
</script>
