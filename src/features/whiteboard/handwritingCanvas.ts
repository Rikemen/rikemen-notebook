/* eslint-disable id-length */
import type { WhiteboardPoint } from "@/features/whiteboard/whiteboardDrawings";

export const resolveCanvasPoint = (event: Pick<PointerEvent, "clientX" | "clientY">, canvas: HTMLCanvasElement): WhiteboardPoint => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / Math.max(rect.width, 1);
  const scaleY = canvas.height / Math.max(rect.height, 1);

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
};
