<template>
  <section
    v-if="layout.state !== 'closed'"
    class="movable-panel workspace-panel-surface"
    :class="panelClass"
    :aria-label="layout.title"
    :data-panel-id="layout.id"
    :style="panelStyle"
    @pointerdown="$emit('focus', layout.id)"
  >
    <header class="movable-panel__header" data-testid="panel-drag-handle" @pointerdown.stop="startDrag">
      <span class="movable-panel__grip" aria-hidden="true">::</span>
      <h2>{{ layout.title }}</h2>
      <div class="movable-panel__actions">
        <AppIconButton
          icon="−"
          :label="minimizeLabel"
          :tooltip="minimizeLabel"
          @click="$emit('minimize', layout.id)"
        />
        <AppIconButton
          :icon="maximizeIcon"
          :label="maximizeLabel"
          :tooltip="maximizeLabel"
          @click="$emit(maximizeEvent, layout.id)"
        />
        <AppIconButton
          icon="×"
          label="閉じる"
          tooltip="閉じる"
          @click="$emit('close', layout.id)"
        />
      </div>
    </header>
    <div
      v-if="layout.state !== 'minimized'"
      class="movable-panel__body"
      :class="{ 'movable-panel__body--maximized': layout.state === 'maximized' }"
    >
      <slot />
    </div>
    <ResizeHandle v-if="canResize" @start-resize="startResize" />
  </section>
</template>

<script lang="ts">
/* eslint-disable id-length, max-lines-per-function, max-statements */
import { computed, defineComponent, type PropType } from "vue";
import type { PanelLayoutItem, WorkspaceLayoutMode } from "@/features/workspace/panelLayout";
import AppIconButton from "@/components/ui/AppIconButton.vue";
import ResizeHandle from "@/components/workspace/ResizeHandle.vue";

type DragMode = "move" | "resize";

interface PointerStart {
  height: number;
  pointerX: number;
  pointerY: number;
  width: number;
  x: number;
  y: number;
}

export default defineComponent({
  name: "MovablePanel",
  components: {
    AppIconButton,
    ResizeHandle,
  },
  props: {
    layout: {
      required: true,
      type: Object as PropType<PanelLayoutItem>,
    },
    mode: {
      default: "docked",
      type: String as PropType<WorkspaceLayoutMode>,
    },
  },
  emits: ["close", "focus", "maximize", "minimize", "move", "resize", "restore"],
  setup(props, { emit }) {
    const isFreeMode = computed(() => props.mode === "free");
    const panelClass = computed(() => ({
      "movable-panel--docked": !isFreeMode.value,
      "movable-panel--free": isFreeMode.value,
      "movable-panel--maximized": props.layout.state === "maximized",
    }));
    const panelStyle = computed(() => {
      if (props.layout.state === "maximized") {
        return {
          zIndex: String(props.layout.zIndex),
        };
      }

      if (!isFreeMode.value) {
        return {};
      }

      return {
        height: `${props.layout.height}px`,
        transform: `translate(${props.layout.x}px, ${props.layout.y}px)`,
        width: `${props.layout.width}px`,
        zIndex: String(props.layout.zIndex),
      };
    });
    const canResize = computed(() => isFreeMode.value && props.layout.state === "normal");
    const maximizeEvent = computed(() => {
      if (props.layout.state === "maximized") {
        return "restore";
      }

      return "maximize";
    });
    const maximizeIcon = computed(() => {
      if (props.layout.state === "maximized") {
        return "▣";
      }

      return "□";
    });
    const maximizeLabel = computed(() => {
      if (props.layout.state === "maximized") {
        return "復元";
      }

      return "最大化";
    });
    const minimizeLabel = computed(() => "最小化");

    const createPointerStart = (event: PointerEvent): PointerStart => ({
      height: props.layout.height,
      pointerX: event.clientX,
      pointerY: event.clientY,
      width: props.layout.width,
      x: props.layout.x,
      y: props.layout.y,
    });

    const trackPointer = (event: PointerEvent, mode: DragMode, start: PointerStart) => {
      const deltaX = event.clientX - start.pointerX;
      const deltaY = event.clientY - start.pointerY;

      if (mode === "move") {
        emit("move", props.layout.id, {
          x: start.x + deltaX,
          y: start.y + deltaY,
        });
        return;
      }

      emit("resize", props.layout.id, {
        height: start.height + deltaY,
        width: start.width + deltaX,
      });
    };

    const startTracking = (event: PointerEvent, mode: DragMode) => {
      if (props.layout.state !== "normal" || !isFreeMode.value) {
        return;
      }

      const start = createPointerStart(event);
      const move = (moveEvent: PointerEvent) => trackPointer(moveEvent, mode, start);
      const stop = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", stop);
      };

      event.preventDefault();
      emit("focus", props.layout.id);
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", stop);
    };

    const startDrag = (event: PointerEvent) => startTracking(event, "move");
    const startResize = (event: PointerEvent) => startTracking(event, "resize");

    return {
      maximizeEvent,
      maximizeIcon,
      maximizeLabel,
      canResize,
      minimizeLabel,
      panelClass,
      panelStyle,
      startDrag,
      startResize,
    };
  },
});
</script>

<style scoped>
.movable-panel {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  text-align: left;
}

.movable-panel--docked {
  position: relative;
  width: 100%;
  height: 100%;
  transform: none;
}

.movable-panel--free {
  position: absolute;
}

.movable-panel--maximized {
  width: 100%;
  height: 100%;
}

.movable-panel--free.movable-panel--maximized {
  inset: 0;
  transform: none;
}

.movable-panel__header {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: var(--space-2);
  min-height: 3rem;
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--color-border);
  cursor: grab;
  touch-action: none;
}

.movable-panel--docked .movable-panel__header {
  cursor: default;
}

.movable-panel__header h2 {
  flex: 1;
  min-width: 0;
  margin: 0;
  color: var(--color-text);
  font-size: 0.95rem;
  font-weight: 700;
}

.movable-panel__grip {
  color: var(--color-text-muted);
  letter-spacing: 0;
  transform: rotate(90deg);
}

.movable-panel__actions {
  display: flex;
  flex: 0 0 auto;
  gap: var(--space-1);
}

.movable-panel__body {
  box-sizing: border-box;
  width: 100%;
  min-height: 0;
  min-width: 0;
  flex: 1;
  overflow: auto;
  padding: var(--space-3);
}

.movable-panel__body :deep(*) {
  box-sizing: border-box;
  min-width: 0;
}

.movable-panel__body--maximized {
  overflow: hidden;
}

.movable-panel__body--maximized > :deep(*) {
  height: 100%;
  min-height: 0;
}
</style>
