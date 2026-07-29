<template>
  <main class="mx-auto max-w-lg px-4 py-10 text-left">
    <section class="ui-raised rounded-[var(--radius-lg)] p-8">
      <h1 class="text-2xl font-bold">アカウント</h1>
      <p class="mt-3 text-sm text-[var(--color-text-secondary)]">新規登録とログインは別画面に分かれました。</p>
      <div class="mt-6 flex gap-3">
        <router-link class="rounded-[var(--radius-sm)] bg-[var(--color-blue)] px-4 py-2 text-white" to="/signup">新規登録</router-link>
        <router-link class="ui-raised rounded-[var(--radius-sm)] px-4 py-2 text-[var(--color-text-primary)]" to="/login">ログイン</router-link>
      </div>
    </section>
  </main>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "AccountPage",
});
</script>
