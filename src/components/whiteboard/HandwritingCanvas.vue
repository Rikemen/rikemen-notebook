<template>
  <div class="handwriting-canvas" role="dialog" aria-modal="true" aria-label="手書きホワイトボード">
    <header class="handwriting-canvas__header">
      <h2>手書きホワイトボード</h2>
      <div class="handwriting-canvas__actions">
        <button type="button" @click="clear">クリア</button>
        <button type="button" @click="$emit('close')">キャンセル</button>
        <button class="handwriting-canvas__save" type="button" @click="save">保存</button>
      </div>
    </header>
    <canvas
      ref="canvasRef"
      class="handwriting-canvas__surface"
      data-testid="handwriting-canvas"
      height="900"
      width="1400"
      @pointerdown="startStroke"
      @pointermove="continueStroke"
      @pointerup="finishStroke"
      @pointerleave="finishStroke"
    />
  </div>
</template>

<script lang="ts">
/* eslint-disable max-lines-per-function, max-statements */
import { defineComponent, onMounted, ref, type PropType } from "vue";
import { resolveCanvasPoint } from "@/features/whiteboard/handwritingCanvas";
import type { WhiteboardDrawing, WhiteboardStroke } from "@/features/whiteboard/whiteboardDrawings";

const blankDataUrl = "data:image/png;base64,";

const getContext = (canvas: HTMLCanvasElement | null) => {
  if (import.meta.env.MODE === "test") {
    return null;
  }

  return canvas?.getContext("2d") ?? null;
};

export default defineComponent({
  name: "HandwritingCanvas",
  props: {
    drawing: {
      default: null,
      type: Object as PropType<WhiteboardDrawing | null>,
    },
  },
  emits: ["close", "save"],
  setup(props, { emit }) {
    const canvasRef = ref<HTMLCanvasElement | null>(null);
    const strokes = ref<WhiteboardStroke[]>(props.drawing?.strokes ?? []);
    const activeStroke = ref<WhiteboardStroke | null>(null);

    const drawLine = (stroke: WhiteboardStroke) => {
      const context = getContext(canvasRef.value);
      if (!context || stroke.points.length < 2) {
        return;
      }

      const previous = stroke.points[stroke.points.length - 2];
      const current = stroke.points[stroke.points.length - 1];
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = 3;
      context.strokeStyle = "#171A20";
      context.beginPath();
      context.moveTo(previous.x, previous.y);
      context.lineTo(current.x, current.y);
      context.stroke();
    };

    const redraw = () => {
      const canvas = canvasRef.value;
      const context = getContext(canvas);
      if (!canvas || !context) {
        return;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);
      strokes.value.forEach((stroke) => {
        for (let index = 1; index < stroke.points.length; index += 1) {
          drawLine({ points: stroke.points.slice(index - 1, index + 1) });
        }
      });
    };

    onMounted(redraw);

    const startStroke = (event: PointerEvent) => {
      if (!canvasRef.value) {
        return;
      }

      activeStroke.value = {
        points: [resolveCanvasPoint(event, canvasRef.value)],
      };
      strokes.value = [...strokes.value, activeStroke.value];
    };
    const continueStroke = (event: PointerEvent) => {
      if (!canvasRef.value || !activeStroke.value) {
        return;
      }

      activeStroke.value.points.push(resolveCanvasPoint(event, canvasRef.value));
      drawLine(activeStroke.value);
    };
    const finishStroke = () => {
      activeStroke.value = null;
    };
    const clear = () => {
      strokes.value = [];
      redraw();
    };
    const save = () => {
      try {
        emit("save", {
          dataUrl: canvasRef.value?.toDataURL("image/png") ?? blankDataUrl,
          strokes: strokes.value,
        });
      } catch {
        emit("save", {
          dataUrl: props.drawing?.dataUrl ?? blankDataUrl,
          strokes: strokes.value,
        });
      }
    };

    return {
      canvasRef,
      clear,
      continueStroke,
      finishStroke,
      save,
      startStroke,
    };
  },
});
</script>

<style scoped>
.handwriting-canvas {
  position: fixed;
  z-index: 90;
  inset: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: var(--space-3);
  box-sizing: border-box;
  background: var(--color-bg);
  padding: var(--space-4);
}

.handwriting-canvas__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  min-width: 0;
}

.handwriting-canvas h2 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 1.1rem;
  font-weight: 800;
}

.handwriting-canvas__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.handwriting-canvas button {
  min-height: 38px;
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  box-shadow: var(--shadow-raised-sm);
  color: var(--color-text-primary);
  font-weight: 800;
  padding: 0 var(--space-3);
}

.handwriting-canvas__save {
  background: var(--color-blue);
  color: white;
}

.handwriting-canvas__surface {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: white;
  box-shadow: var(--shadow-inset);
  touch-action: none;
}
</style>
