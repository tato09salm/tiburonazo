import type { CanvasElement, CanvasSlideData, CanvasBackground } from "@/components/admin/hero/canvas/types";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/components/admin/hero/canvas/types";

export const BASE_W = 1440;
export const BASE_H = 720;

export const CORNER_HANDLES = new Set(["top-left", "top-right", "bottom-left", "bottom-right"]);

export function pct(value: number, base: number): string {
  return `${(value / base) * 100}%`;
}

export function buildData(bg: CanvasBackground, elements: CanvasElement[]): CanvasSlideData {
  return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT, background: bg, elements };
}

export function autoFitTextHeight(width: number, fontSize: number, lineHeight: number, text: string): number {
  const cpl = Math.max(1, Math.round(width / (fontSize * 0.6)));
  const lines = Math.max(1, Math.ceil(text.length / cpl));
  return Math.max(30, Math.round(lines * fontSize * lineHeight + 12));
}

export function autoFitButtonHeight(fontSize: number): number {
  return Math.max(30, Math.round(fontSize * 1.5 + 12));
}

export function computeCornerResize(
  startElW: number, startElH: number, startElX: number, startElY: number,
  dx: number, dy: number, handle: string,
  startFontSize: number, startLineHeight: number, startLetterSpacing: number
) {
  let newW = startElW + dx;
  let newH = startElH + dy;
  let newX = startElX;
  let newY = startElY;
  if (handle.includes("left")) { newW = startElW - dx; newX = startElX + dx; }
  if (handle.includes("top")) { newH = startElH - dy; newY = startElY + dy; }
  newW = Math.max(30, Math.round(newW));
  newH = Math.max(20, Math.round(newH));
  const sx = newW / startElW;
  const sy = newH / startElH;
  const sf = Math.max(0.2, Math.min(5, Math.sqrt(sx * sy)));
  const attrs: any = {
    x: Math.round(newX), y: Math.round(newY),
    width: newW, height: newH,
    fontSize: Math.max(8, Math.round(startFontSize * sf)),
    lineHeight: Math.round(startLineHeight * 100 * sf) / 100,
  };
  if (startLetterSpacing) attrs.letterSpacing = Math.round(startLetterSpacing * sf);
  return attrs;
}

export function computeEdgeResize(
  startElX: number, startElY: number, startElW: number, startElH: number,
  dx: number, dy: number, handle: string
) {
  const attrs: any = {};
  switch (handle) {
    case "top-center": attrs.y = Math.round(startElY + dy); attrs.height = Math.max(20, Math.round(startElH - dy)); break;
    case "middle-left": attrs.x = Math.round(startElX + dx); attrs.width = Math.max(20, Math.round(startElW - dx)); break;
    case "middle-right": attrs.width = Math.max(20, Math.round(startElW + dx)); break;
    case "bottom-center": attrs.height = Math.max(20, Math.round(startElH + dy)); break;
  }
  return attrs;
}
