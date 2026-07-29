<template>
  <div class="layout">
    <div class="app-shell">
      <div class="app-shell__content">
        <header v-if="!isWorkspaceMaximized" class="app-header" data-testid="app-header">
          <div class="app-header__inner">
            <button class="app-header__menu-button" aria-label="メニューを開く" type="button" @click="toggleMenu()">
              <span class="material-symbols-outlined" aria-hidden="true">menu</span>
            </button>
            <router-link class="app-header__logo" to="/">{{ appName }}</router-link>
            <HeaderMenu class="app-header__nav" />
            <div v-show="menu" class="app-menu-overlay">
              <div class="app-menu-overlay__panel">
                <MenuList @close-menu="toggleMenu()" />
              </div>
              <button class="app-menu-overlay__backdrop" aria-label="メニューを閉じる" type="button" @click="toggleMenu()" />
            </div>
          </div>
        </header>
        <div class="app-router-view" :class="{ 'app-router-view--workspace-maximized': isWorkspaceMaximized }">
          <router-view />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";

import { auth } from "@/utils/firebase";
import { User } from "firebase/auth";

import { useI18nParam } from "@/i18n/utils";
import { useStore } from "@/store/index";

import { APP_NAME } from "@/config/appBrand";
import { useWorkspaceStore } from "@/features/workspace/workspaceStore";
import HeaderMenu from "@/components/HeaderMenu.vue";
import MenuList from "@/components/MenuList.vue";
interface UserData {
  user: User | null;
}

export default defineComponent({
  name: "AppLayout",
  components: {
    HeaderMenu,
    MenuList,
  },
  setup() {
    const route = useRoute();
    const store = useStore();
    const workspaceStore = useWorkspaceStore();
    const user = reactive<UserData>({ user: null });
    const menu = ref(false);
    const isWorkspaceMaximized = computed(() => {
      if (route.meta.workspace !== true) {
        return false;
      }

      const noteId = String(route.params.noteId ?? "");
      return Boolean(noteId && workspaceStore.layoutForNote(noteId).some((panel) => panel.state === "maximized"));
    });

    useI18nParam();

    onMounted(() => {
      auth.onAuthStateChanged((fbuser) => {
        if (fbuser) {
          user.user = fbuser;
          store.setUser(fbuser);
        } else {
          store.setUser(null);
        }
      });
    });

    const toggleMenu = () => {
      menu.value = !menu.value;
    };
    return {
      appName: APP_NAME,
      isWorkspaceMaximized,
      user,

      menu,
      toggleMenu,
    };
  },
});
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: var(--color-bg);
}

.app-shell__content {
  min-width: 0;
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 30;
  background: var(--color-surface-strong);
  box-shadow: var(--shadow-raised-sm);
}

.app-header__inner {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  min-height: 56px;
  min-width: 0;
  padding: 0 var(--space-4);
}

.app-header__menu-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: var(--radius-xs);
  background: var(--color-surface);
  box-shadow: var(--shadow-raised-sm);
  color: var(--color-icon);
}

.app-header__menu-button:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);
}

.app-header__logo {
  flex: 0 0 auto;
  color: var(--color-text-primary);
  font-size: 24px;
  font-weight: 700;
  line-height: 32px;
  text-decoration: none;
}

.app-header__nav {
  margin-left: auto;
}

.app-router-view {
  min-width: 0;
}

.app-router-view--workspace-maximized {
  height: 100dvh;
  overflow: hidden;
}

.app-menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
}

.app-menu-overlay__panel {
  width: min(80vw, 280px);
  background: var(--color-surface-strong);
  box-shadow: var(--shadow-raised);
}

.app-menu-overlay__backdrop {
  flex: 1;
  border: 0;
  background: rgb(0 0 0 / 38%);
}

@media (width < 768px) {
  .app-header__nav {
    display: none;
  }
}
</style>
