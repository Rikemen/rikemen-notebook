<template>
  <AuthPageShell :description="description" eyebrow="新規登録" :title="title">
    <AppButton class="w-full" variant="primary" @click="runGoogleAuth">Googleで新規登録</AppButton>
    <p class="mt-4 text-center text-sm text-[var(--color-text-secondary)]">
      すでにアカウントがある場合は
      <router-link class="font-semibold text-[var(--color-blue)]" to="/login">ログイン</router-link>
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
  name: "SignUpPage",
  components: {
    AppButton,
    AuthPageShell,
  },
  setup() {
    return {
      ...useGoogleAuthAction(),
      description: "Googleアカウントで登録すると、ノート、教材、AIチャット履歴を自分専用に保存できます。",
      title: `${APP_NAME}を始める`,
    };
  },
});
</script>
