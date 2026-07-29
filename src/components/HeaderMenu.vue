<template>
  <nav id="nav" class="flex flex-wrap items-center justify-center gap-3 text-sm">
    <router-link :to="localizedUrl('/')">HOME</router-link>
    <template v-if="isSignedIn">
      <router-link :to="localizedUrl('/notes')">マイノート</router-link>
      <router-link :to="localizedUrl('/about')">使い方</router-link>
    </template>
    <template v-else>
      <router-link :to="localizedUrl('/signup')">新規登録</router-link>
      <router-link :to="localizedUrl('/login')">ログイン</router-link>
    </template>
  </nav>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useIsSignedIn, useLang } from "@/utils/utils";

export default defineComponent({
  setup() {
    const isSignedIn = useIsSignedIn();
    const { localizedUrl } = useLang();

    return {
      isSignedIn,
      localizedUrl,
    };
  },
});
</script>
