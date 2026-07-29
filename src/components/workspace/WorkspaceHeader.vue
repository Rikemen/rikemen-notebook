<template>
  <header class="workspace-header">
    <div class="workspace-header__brand">
      <div class="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-blue)] text-white shadow-[var(--shadow-raised-sm)]">
        <span class="material-symbols-outlined" aria-hidden="true">menu_book</span>
      </div>
      <div class="workspace-header__brand-copy">
        <p class="text-lg font-bold text-[var(--color-text-primary)]">{{ appName }}</p>
        <p class="text-xs font-semibold text-[var(--color-text-secondary)]">{{ noteTitle }}</p>
      </div>
    </div>

    <nav class="workspace-panel-switcher" aria-label="パネル表示切り替え">
      <button
        v-for="panel in panels"
        :key="panel.id"
        class="workspace-panel-toggle"
        :aria-label="panelToggleLabel(panel.id, panel.title)"
        :aria-pressed="panelVisibility[panel.id]"
        :data-panel-id="panel.id"
        :title="panelToggleLabel(panel.id, panel.title)"
        type="button"
        @click="$emit('toggle-panel', panel.id)"
      >
        <span class="material-symbols-outlined" aria-hidden="true">{{ panel.icon }}</span>
        <span>{{ panel.title }}</span>
      </button>
    </nav>

    <div class="workspace-header__actions">
      <AppIconButton icon="undo" label="元に戻す" />
      <AppIconButton icon="redo" label="やり直す" />
      <span class="ui-raised hidden rounded-[var(--radius-pill)] px-4 py-2 text-xs text-[var(--color-text-secondary)] sm:inline-flex">自動保存済み</span>
      <AppButton variant="primary">共有</AppButton>
      <span class="ui-raised flex h-10 w-10 items-center justify-center rounded-full font-bold text-[var(--color-blue)]">{{ userInitial }}</span>
    </div>
  </header>
</template>

<script lang="ts">
import { computed, defineComponent, type PropType } from "vue";
import type { AuthUser } from "@/features/auth/types";
import { APP_NAME } from "@/config/appBrand";
import { workspacePanels, type WorkspacePanelId, type WorkspacePanelVisibility } from "@/features/workspace/panels";
import AppButton from "@/components/ui/AppButton.vue";
import AppIconButton from "@/components/ui/AppIconButton.vue";

const createDefaultPanelVisibility = (): WorkspacePanelVisibility => ({
  "ai-chat": true,
  "diagram-code": true,
  textbook: true,
  whiteboard: true,
});

export default defineComponent({
  name: "WorkspaceHeader",
  components: {
    AppButton,
    AppIconButton,
  },
  props: {
    autosaveStatus: {
      default: null,
      type: Object,
    },
    currentUser: {
      default: null,
      type: Object as PropType<AuthUser | null>,
    },
    noteTitle: {
      default: "",
      type: String,
    },
    panelVisibility: {
      default: createDefaultPanelVisibility,
      type: Object as PropType<WorkspacePanelVisibility>,
    },
  },
  emits: {
    "toggle-panel": (panelId: WorkspacePanelId) => workspacePanels.some((panel) => panel.id === panelId),
  },
  setup(props) {
    const userInitial = computed(() => {
      const displayName = props.currentUser?.displayName ?? props.currentUser?.email ?? "M";
      return displayName.slice(0, 1).toUpperCase();
    });
    const panelToggleLabel = (panelId: WorkspacePanelId, title: string) => {
      if (props.panelVisibility[panelId]) {
        return `${title}パネルを非表示`;
      }

      return `${title}パネルを表示`;
    };

    return {
      appName: APP_NAME,
      panels: workspacePanels,
      panelToggleLabel,
      userInitial,
    };
  },
});
</script>

<style scoped>
.workspace-header {
  align-items: center;
  background: var(--color-bg);
  box-sizing: border-box;
  display: grid;
  gap: var(--space-4);
  grid-template-columns: minmax(190px, auto) minmax(0, 1fr) auto;
  min-width: 0;
  padding: 16px 24px;
  width: 100%;
}

.workspace-header__brand,
.workspace-header__actions {
  align-items: center;
  display: flex;
  gap: var(--space-3);
  min-width: 0;
}

.workspace-header__brand-copy {
  min-width: 0;
}

.workspace-header__brand-copy p {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workspace-header__actions {
  gap: var(--space-2);
  justify-content: flex-end;
}

.workspace-panel-switcher {
  display: grid;
  gap: var(--space-2);
  grid-template-columns: repeat(4, minmax(0, 1fr));
  min-width: 0;
}

.workspace-panel-toggle {
  align-items: center;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-raised-sm);
  color: var(--color-text-primary);
  display: inline-flex;
  gap: var(--space-2);
  justify-content: center;
  min-height: 44px;
  min-width: 0;
  padding: 0 var(--space-3);
  white-space: nowrap;
}

.workspace-panel-toggle:hover {
  color: var(--color-blue);
}

.workspace-panel-toggle:focus-visible {
  box-shadow: var(--shadow-focus);
  outline: none;
}

.workspace-panel-toggle[aria-pressed="true"] {
  box-shadow: var(--shadow-inset);
  color: var(--color-blue);
}

.workspace-panel-toggle .material-symbols-outlined {
  flex: 0 0 auto;
  font-size: 1.1rem;
}

.workspace-panel-toggle span:last-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (width < 1280px) {
  .workspace-header {
    grid-template-columns: minmax(0, 1fr) auto;
    padding: var(--space-3) var(--space-4);
  }

  .workspace-panel-switcher {
    grid-column: 1 / -1;
    grid-row: 2;
  }
}

@media (width < 768px) {
  .workspace-header {
    gap: var(--space-2);
    grid-template-columns: minmax(0, 1fr);
    padding: var(--space-2) var(--space-3);
  }

  .workspace-header__actions {
    display: none;
  }

  .workspace-panel-switcher {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    max-width: 100%;
  }

  .workspace-panel-toggle {
    min-height: 44px;
  }
}
</style>
