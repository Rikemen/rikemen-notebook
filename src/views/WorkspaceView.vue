<template>
  <main class="workspace-view" :class="{ 'workspace-view--maximized': maximizedPanel }">
    <WorkspaceHeader
      v-if="!maximizedPanel"
      :autosave-status="autosaveStatus"
      :current-user="currentUser"
      :note-title="noteTitle"
      :panel-visibility="panelVisibility"
      @toggle-panel="togglePanelVisibility"
    />

    <section
      aria-label="ノートワークスペース"
      class="workspace-view__stage"
      :class="{ 'workspace-view__stage--maximized': maximizedPanel }"
    >
      <div v-if="!maximizedPanel" class="workspace-view__toolbar" role="toolbar" aria-label="ワークスペース表示モード">
        <button type="button" :aria-pressed="layoutMode === 'docked'" @click="setDockedMode">ドッキング</button>
        <button type="button" :aria-pressed="layoutMode === 'free'" @click="setFreeMode">自由配置</button>
      </div>
      <div ref="panelGridRef" class="workspace-view__panel-grid" :class="panelGridClass">
        <MovablePanel
          v-for="panel in visiblePanels"
          :key="panel.id"
          :layout="panel"
          :mode="layoutMode"
          @close="closePanel"
          @focus="focusPanel"
          @maximize="maximizePanel"
          @minimize="minimizePanel"
          @move="movePanel"
          @resize="resizePanel"
          @restore="restorePanel"
        >
          <TextbookPanel v-if="panel.id === 'textbook'" :current-user="currentUser" :note-id="noteId" />
          <WhiteboardPanel v-else-if="panel.id === 'whiteboard'" :note-id="noteId" />
          <AiChatPanel v-else-if="panel.id === 'ai-chat'" :current-user="currentUser" :note-id="noteId" />
          <DiagramCodePanel v-else :note-id="noteId" />
        </MovablePanel>
      </div>
    </section>
    <MinimizedDock v-if="!maximizedPanel" :panels="minimizedPanels" @restore="restorePanel" />
  </main>
</template>

<script lang="ts">
/* eslint-disable max-lines, max-lines-per-function, max-statements, no-ternary */
import { computed, defineComponent, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { mapFirebaseUser } from "@/features/auth/mapFirebaseUser";
import { createAutosaveStatus } from "@/features/notes/autosaveStatus";
import { useNotesStore } from "@/features/notes/notesStore";
import type { WorkspacePanelId, WorkspacePanelVisibility } from "@/features/workspace/panels";
import { workspaceDefaultBounds, type PanelBounds, type WorkspaceLayoutMode } from "@/features/workspace/panelLayout";
import { useWorkspaceStore } from "@/features/workspace/workspaceStore";
import AiChatPanel from "@/components/ai/AiChatPanel.vue";
import DiagramCodePanel from "@/components/diagram-code/DiagramCodePanel.vue";
import TextbookPanel from "@/components/textbook/TextbookPanel.vue";
import WhiteboardPanel from "@/components/whiteboard/WhiteboardPanel.vue";
import MinimizedDock from "@/components/workspace/MinimizedDock.vue";
import MovablePanel from "@/components/workspace/MovablePanel.vue";
import WorkspaceHeader from "@/components/workspace/WorkspaceHeader.vue";
import { useStore } from "@/store/index";

export default defineComponent({
  name: "WorkspaceView",
  components: {
    AiChatPanel,
    DiagramCodePanel,
    MinimizedDock,
    MovablePanel,
    TextbookPanel,
    WhiteboardPanel,
    WorkspaceHeader,
  },
  setup() {
    const authStore = useStore();
    const notesStore = useNotesStore();
    const route = useRoute();
    const workspaceStore = useWorkspaceStore();
    const panelGridRef = ref<HTMLElement | null>(null);
    const stageBounds = ref(workspaceDefaultBounds);
    const currentUser = computed(() => mapFirebaseUser(authStore.user ?? null));
    const noteId = computed(() => String(route.params.noteId ?? ""));
    const currentNote = computed(() => notesStore.notes.find((note) => note.id === noteId.value));
    const noteTitle = computed(() => currentNote.value?.title ?? "未選択のノート");
    const panelLayouts = computed(() => workspaceStore.layoutForNote(noteId.value));
    const maximizedPanel = computed(() => panelLayouts.value.find((panel) => panel.state === "maximized"));
    const visiblePanels = computed(() => {
      if (maximizedPanel.value) {
        return [maximizedPanel.value];
      }

      return panelLayouts.value.filter((panel) => panel.state !== "minimized" && panel.state !== "closed");
    });
    const minimizedPanels = computed(() => panelLayouts.value.filter((panel) => panel.state === "minimized"));
    const panelVisibility = computed<WorkspacePanelVisibility>(() => ({
      "ai-chat": workspaceStore.isLayoutPanelVisible(noteId.value, "ai-chat"),
      "diagram-code": workspaceStore.isLayoutPanelVisible(noteId.value, "diagram-code"),
      textbook: workspaceStore.isLayoutPanelVisible(noteId.value, "textbook"),
      whiteboard: workspaceStore.isLayoutPanelVisible(noteId.value, "whiteboard"),
    }));
    const layoutMode = computed(() => workspaceStore.layoutModeForNote(noteId.value));
    const dockedPanelCount = computed(() =>
      layoutMode.value === "docked" && !maximizedPanel.value
        ? visiblePanels.value.filter((panel) => panel.state === "normal").length
        : 0,
    );
    const panelGridClass = computed(() => ({
      "workspace-view__panel-grid--count-2": dockedPanelCount.value === 2,
      "workspace-view__panel-grid--docked": layoutMode.value === "docked",
      "workspace-view__panel-grid--free": layoutMode.value === "free",
      "workspace-view__panel-grid--maximized": Boolean(maximizedPanel.value),
    }));

    const updateStageBounds = () => {
      const width = panelGridRef.value?.clientWidth ?? workspaceDefaultBounds.width;
      const height = panelGridRef.value?.clientHeight ?? workspaceDefaultBounds.height;
      stageBounds.value = {
        height: Math.max(height, 1),
        width: Math.max(width, 1),
      };
      workspaceStore.repairLayout(noteId.value, stageBounds.value);
    };

    onMounted(() => {
      updateStageBounds();
      window.addEventListener("resize", updateStageBounds);
    });
    onBeforeUnmount(() => {
      window.removeEventListener("resize", updateStageBounds);
    });

    const movePanel = (panelId: WorkspacePanelId, nextPosition: Pick<PanelBounds, "x" | "y">) =>
      workspaceStore.moveLayoutPanel(noteId.value, panelId, nextPosition, stageBounds.value);
    const resizePanel = (panelId: WorkspacePanelId, nextSize: Pick<PanelBounds, "height" | "width">) =>
      workspaceStore.resizeLayoutPanel(noteId.value, panelId, nextSize, stageBounds.value);
    const focusPanel = (panelId: WorkspacePanelId) => workspaceStore.focusLayoutPanel(noteId.value, panelId);
    const minimizePanel = (panelId: WorkspacePanelId) => workspaceStore.minimizeLayoutPanel(noteId.value, panelId);
    const maximizePanel = (panelId: WorkspacePanelId) => workspaceStore.maximizeLayoutPanel(noteId.value, panelId, stageBounds.value);
    const restorePanel = (panelId: WorkspacePanelId) => workspaceStore.restoreLayoutPanel(noteId.value, panelId);
    const closePanel = (panelId: WorkspacePanelId) => workspaceStore.closeLayoutPanel(noteId.value, panelId);
    const togglePanelVisibility = (panelId: WorkspacePanelId) => workspaceStore.toggleLayoutPanelVisibility(noteId.value, panelId);
    const setLayoutMode = (mode: WorkspaceLayoutMode) => {
      workspaceStore.setLayoutMode(noteId.value, mode);
      updateStageBounds();
    };
    const setDockedMode = () => setLayoutMode("docked");
    const setFreeMode = () => setLayoutMode("free");

    return {
      autosaveStatus: createAutosaveStatus(),
      closePanel,
      currentUser,
      focusPanel,
      layoutMode,
      maximizePanel,
      minimizedPanels,
      minimizePanel,
      movePanel,
      maximizedPanel,
      noteId,
      noteTitle,
      panelGridClass,
      panelGridRef,
      panelVisibility,
      resizePanel,
      restorePanel,
      setDockedMode,
      setFreeMode,
      togglePanelVisibility,
      visiblePanels,
    };
  },
});
</script>

<style scoped>
.workspace-view {
  --app-shell-header-height: 56px;
  display: flex;
  flex-direction: column;
  height: calc(100dvh - var(--app-shell-header-height));
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: var(--color-bg);
  color: var(--color-text);
}
.workspace-view--maximized {
  height: 100dvh;
}
.workspace-view__stage {
  position: relative;
  display: grid;
  flex: 1;
  grid-template-rows: auto minmax(0, 1fr);
  gap: var(--space-3);
  box-sizing: border-box;
  width: 100%;
  height: auto;
  min-width: 0;
  min-height: 0;
  padding: var(--space-3);
  overflow: hidden;
}
.workspace-view__stage--maximized {
  grid-template-rows: minmax(0, 1fr);
  gap: 0;
  padding: 0;
}
.workspace-view__toolbar {
  display: flex;
  gap: var(--space-2);
  min-width: 0;
}

.workspace-view__toolbar button {
  min-height: 2rem;
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  box-shadow: var(--shadow-raised-sm);
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0 var(--space-3);
}

.workspace-view__toolbar button[aria-pressed="true"] {
  box-shadow: var(--shadow-inset);
  color: var(--color-blue);
}

.workspace-view__panel-grid {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.workspace-view__panel-grid--docked {
  display: grid;
  grid-template-columns: minmax(280px, 0.9fr) minmax(500px, 2fr) minmax(320px, 1fr);
  grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);
  grid-template-areas:
    "textbook whiteboard ai"
    "textbook whiteboard diagram";
  gap: var(--space-3);
}

.workspace-view__panel-grid--free {
  display: block;
}
.workspace-view__panel-grid--maximized {
  display: block;
}
.workspace-view__panel-grid--maximized :deep(.workspace-panel-surface) {
  border-radius: 0;
  box-shadow: none;
}
.workspace-view__panel-grid :deep(.movable-panel) {
  min-width: 0;
  min-height: 0;
}

.workspace-view__panel-grid--docked :deep([data-panel-id="textbook"]) {
  grid-area: textbook;
}

.workspace-view__panel-grid--docked :deep([data-panel-id="whiteboard"]) {
  grid-area: whiteboard;
}

.workspace-view__panel-grid--docked :deep([data-panel-id="ai-chat"]) {
  grid-area: ai;
}

.workspace-view__panel-grid--docked :deep([data-panel-id="diagram-code"]) {
  grid-area: diagram;
}

.workspace-view__panel-grid--docked.workspace-view__panel-grid--count-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: minmax(0, 1fr);
  grid-template-areas: none;
}

.workspace-view__panel-grid--docked.workspace-view__panel-grid--count-2 :deep(.movable-panel) {
  grid-area: auto;
}

@media (width < 1280px) {
  .workspace-view__panel-grid--docked {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: repeat(2, minmax(0, 1fr));
    grid-template-areas:
      "textbook whiteboard"
      "ai diagram";
  }
}

@media (width < 768px) {
  .workspace-view__panel-grid--docked.workspace-view__panel-grid--count-2 {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: repeat(2, minmax(0, 1fr));
  }

  .workspace-view__panel-grid--docked {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(4, minmax(0, 1fr));
    grid-template-areas:
      "textbook"
      "whiteboard"
      "ai"
      "diagram";
  }
}
</style>
