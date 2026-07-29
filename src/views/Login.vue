<template>
  <AuthPageShell :description="description" eyebrow="ログイン" :title="title">
    <AppButton class="w-full" variant="primary" @click="runGoogleAuth">Googleでログイン</AppButton>
    <p class="mt-4 text-center text-sm text-[var(--color-text-secondary)]">
      初めて利用する場合は
      <router-link class="font-semibold text-[var(--color-blue)]" to="/signup">新規登録</router-link>
    </p>
    <p v-if="errorMessage" class="mt-4 rounded-[var(--radius-sm)] bg-[var(--color-red-soft)] p-3 text-sm text-[var(--color-red)]">
      {{ errorMessage }}
    </p>
  </AuthPageShell>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useGoogleAuthAction } from "@/features/auth/useGoogleAuthAction";
import { APP_NAME } from "@/config/appBrand";
import AppButton from "@/components/ui/AppButton.vue";
import AuthPageShell from "@/components/auth/AuthPageShell.vue";

export default defineComponent({
  name: "LoginPage",
  components: {
    AppButton,
    AuthPageShell,
  },
  setup() {
    return {
      ...useGoogleAuthAction(),
      description: "保存済みノート、教材、AIチャット履歴へ戻るにはGoogleアカウントでログインしてください。",
      title: `${APP_NAME}に戻る`,
    };
  },
});
</script>
