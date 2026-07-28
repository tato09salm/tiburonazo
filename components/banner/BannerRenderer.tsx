"use client";

import { memo, useRef, useCallback, useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CanvasSlideData, CanvasElement } from "@/components/admin/hero/canvas/types";
import { BASE_W, BASE_H, CORNER_HANDLES, pct, computeCornerResize, computeEdgeResize } from "@/lib/canvas-utils";

const HANDLES = [
  { key: "top-left", top: 0, left: 0, cursor: "nwse-resize" },
  { key: "top-center", top: 0, left: 50, cursor: "ns-resize" },
  { key: "top-right", top: 0, left: 100, cursor: "nesw-resize" },
  { key: "middle-left", top: 50, left: 0, cursor: "ew-resize" },
  { key: "middle-right", top: 50, left: 100, cursor: "ew-resize" },
  { key: "bottom-left", top: 100, left: 0, cursor: "nesw-resize" },
  { key: "bottom-center", top: 100, left: 50, cursor: "ns-resize" },
  { key: "bottom-right", top: 100, left: 100, cursor: "nwse-resize" },
] as const;

const deviceSizes = {
  desktop: { maxWidth: "1440px" },
  tablet: { maxWidth: "768px" },
  mobile: { maxWidth: "390px" },
} as const;

const TEXT_SHADOW = "0 2px 8px rgba(0,0,0,0.3)";

interface Props {
  data: CanvasSlideData;
  className?: string;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onElementChange?: (id: string, attrs: Partial<CanvasElement>) => void;
  editingId?: string | null;
  editText?: string;
  onEditTextChange?: (text: string) => void;
  onFinishEditing?: () => void;
  onStartEditing?: (id: string) => void;
  device?: "desktop" | "tablet" | "mobile";
}

// ── Memo'd sub-component for individual elements ──

interface ElementRendererProps {
  el: CanvasElement;
  isSelected: boolean;
  isEditing: boolean;
  isEditor: boolean;
  scale: number;
  onSelect: (id: string) => void;
  onPointerDown: (e: React.PointerEvent, el: CanvasElement) => void;
  onResizeDown: (e: React.PointerEvent, el: CanvasElement, handle: string) => void;
  onStartEditing: (id: string) => void;
}

const ElementRenderer = memo(function ElementRenderer({
  el, isSelected, isEditing, isEditor, scale,
  onSelect, onPointerDown, onResizeDown, onStartEditing,
}: ElementRendererProps) {
  const contentStyle: React.CSSProperties = isEditing ? { visibility: "hidden" } : {};

  const content = useMemo(() => {
    switch (el.type) {
      case "text":
        return (
          <div
            style={{
              width: "100%", height: "100%", display: "flex", alignItems: "center",
              ...contentStyle, fontFamily: el.fontFamily,
              fontSize: scale ? `${scale * el.fontSize}px` : `${el.fontSize}px`,
              fontWeight: el.fontWeight, fontStyle: el.fontStyle || undefined,
              color: el.textColor, textAlign: el.textAlign,
              letterSpacing: `${el.letterSpacing}px`, lineHeight: el.lineHeight,
              overflow: "hidden", textShadow: TEXT_SHADOW,
            }}
          >
            <span style={{ wordBreak: "break-word", maxWidth: "100%" }}>{el.text}</span>
          </div>
        );
      case "image":
      case "gif":
        return (
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            <Image src={el.src} alt="" fill className="drop-shadow-2xl" style={{ objectFit: el.fit || "contain" }} sizes="50vw" />
          </div>
        );
      case "button":
        return (
          <Link
            href={el.url || "#"}
            style={{
              display: "flex", alignItems: "center",
              justifyContent: (el as any).textAlign === "left" ? "flex-start" : (el as any).textAlign === "right" ? "flex-end" : "center",
              textAlign: (el as any).textAlign || "center",
              width: "100%", height: "100%", backgroundColor: el.backgroundColor,
              color: el.textColor, borderRadius: `${el.borderRadius}px`,
              fontFamily: el.fontFamily,
              fontSize: scale ? `${scale * el.fontSize}px` : `${el.fontSize}px`,
              fontWeight: el.fontWeight, textDecoration: "none", ...contentStyle,
            }}
            className="hover:scale-105 transition-transform shadow-lg whitespace-nowrap"
            onClick={isEditor ? (e) => e.preventDefault() : undefined}
          >
            {el.text}
          </Link>
        );
      default:
        return null;
    }
  }, [el, isEditing, scale, isEditor]);

  return (
    <div
      style={{
        position: "absolute",
        left: pct(el.x, BASE_W), top: pct(el.y, BASE_H),
        width: pct(el.width, BASE_W), height: pct(el.height, BASE_H),
        transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
        opacity: el.opacity, zIndex: el.zIndex + 10,
        ...(isEditor ? { cursor: el.locked ? "default" : "move" } : {}),
      }}
      onPointerDown={isEditor ? (e) => onPointerDown(e, el) : undefined}
      onClick={isEditor ? (e) => { e.stopPropagation(); onSelect(el.id); } : undefined}
      onDoubleClick={isEditor && onStartEditing ? () => onStartEditing(el.id) : undefined}
    >
      {content}
      {isSelected && isEditor && (
        <>
          <div style={{ position: "absolute", inset: 0, border: "2px solid #11ABC4", borderRadius: "2px", pointerEvents: "none", zIndex: 60 }} />
          {HANDLES.map((h) => (
            <div
              key={h.key}
              onPointerDown={(e) => onResizeDown(e, el, h.key)}
              style={{
                position: "absolute", top: h.top === 50 ? "50%" : `${h.top}%`,
                left: h.left === 50 ? "50%" : `${h.left}%`,
                width: 12, height: 12, backgroundColor: "#11ABC4",
                border: "2px solid white", borderRadius: 2,
                transform: "translate(-50%, -50%)", cursor: h.cursor, zIndex: 70,
              }}
            />
          ))}
        </>
      )}
    </div>
  );
});

// ── Inline editing textarea ──

function EditingTextarea({
  el, scale, editText, onEditTextChange, onFinishEditing,
}: {
  el: CanvasElement; scale: number; editText?: string;
  onEditTextChange?: (text: string) => void; onFinishEditing?: () => void;
}) {
  return (
    <textarea
      value={editText || ""}
      onChange={(e) => onEditTextChange?.(e.target.value)}
      onBlur={onFinishEditing}
      onFocus={(e) => e.target.select()}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onFinishEditing?.(); }
        if (e.key === "Escape") { onFinishEditing?.(); }
      }}
      autoFocus
      className="absolute z-[100] resize-none overflow-hidden bg-transparent border-2 border-[#11ABC4] rounded outline-none"
      style={{
        left: pct(el.x, BASE_W), top: pct(el.y, BASE_H),
        width: pct(el.width, BASE_W), height: pct(el.height, BASE_H),
        fontSize: scale ? `${scale * ((el as any).fontSize || 24)}px` : `${(el as any).fontSize || 24}px`,
        fontFamily: (el as any).fontFamily || "Inter, sans-serif",
        fontWeight: (el as any).fontWeight || "normal",
        fontStyle: (el as any).fontStyle || "normal",
        textAlign: (el as any).textAlign || "left",
        color: (el as any).textColor || "#ffffff",
        lineHeight: (el as any).lineHeight || 1.2,
        padding: "4px",
      }}
      onClick={(e) => e.stopPropagation()}
    />
  );
}

// ── Main component ──

export function BannerRenderer({
  data, className, selectedId, onSelect, onElementChange,
  editingId, editText, onEditTextChange, onFinishEditing, onStartEditing,
  device = "desktop",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const isEditor = !!onSelect;

  const dragRef = useRef<{
    id: string; startMouseX: number; startMouseY: number; startElX: number; startElY: number;
  } | null>(null);

  const resizeRef = useRef<{
    id: string; handle: string; startMouseX: number; startMouseY: number;
    startElX: number; startElY: number; startElW: number; startElH: number;
    startFontSize: number; startLineHeight: number; startLetterSpacing: number;
  } | null>(null);

  const scale = containerWidth ? containerWidth / BASE_W : 1;

  const handleCallbackRef = useRef(onElementChange);
  handleCallbackRef.current = onElementChange;

  const selectCallbackRef = useRef(onSelect);
  selectCallbackRef.current = onSelect;

  const scaleRef = useRef(scale);
  scaleRef.current = scale;

  const editingCallbackRef = useRef(onFinishEditing);
  editingCallbackRef.current = onFinishEditing;

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const measure = () => setContainerWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!isEditor) return;
    const handleMove = (e: PointerEvent) => {
      const s = scaleRef.current;
      if (dragRef.current) {
        const { id, startMouseX, startMouseY, startElX, startElY } = dragRef.current;
        const dx = (e.clientX - startMouseX) / s;
        const dy = (e.clientY - startMouseY) / s;
        handleCallbackRef.current?.(id, {
          x: Math.round(startElX + dx),
          y: Math.round(startElY + dy),
        });
      }
      if (resizeRef.current) {
        const r = resizeRef.current;
        const dx = (e.clientX - r.startMouseX) / s;
        const dy = (e.clientY - r.startMouseY) / s;
        if (CORNER_HANDLES.has(r.handle)) {
          handleCallbackRef.current?.(r.id, computeCornerResize(
            r.startElW, r.startElH, r.startElX, r.startElY, dx, dy, r.handle,
            r.startFontSize, r.startLineHeight, r.startLetterSpacing
          ));
        } else {
          handleCallbackRef.current?.(r.id, computeEdgeResize(
            r.startElX, r.startElY, r.startElW, r.startElH, dx, dy, r.handle
          ));
        }
      }
    };
    const handleUp = () => { dragRef.current = null; resizeRef.current = null; };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [isEditor]);

  const onPointerDown = useCallback((e: React.PointerEvent, el: CanvasElement) => {
    if (!handleCallbackRef.current || el.locked) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      id: el.id, startMouseX: e.clientX, startMouseY: e.clientY, startElX: el.x, startElY: el.y,
    };
  }, []);

  const onResizeDown = useCallback((e: React.PointerEvent, el: CanvasElement, handle: string) => {
    if (!handleCallbackRef.current || el.locked) return;
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    resizeRef.current = {
      id: el.id, handle, startMouseX: e.clientX, startMouseY: e.clientY,
      startElX: el.x, startElY: el.y, startElW: el.width, startElH: el.height,
      startFontSize: (el as any).fontSize ?? 16,
      startLineHeight: (el as any).lineHeight ?? 1.2,
      startLetterSpacing: (el as any).letterSpacing ?? 0,
    };
  }, []);

  const { background, elements } = data;

  const bgStyle: React.CSSProperties = useMemo(
    () => (background.type === "color" ? { backgroundColor: background.color } : {}),
    [background.type, background.color]
  );

  const visibleElements = useMemo(
    () => elements.filter((el) => el.visible).sort((a, b) => a.zIndex - b.zIndex),
    [elements]
  );

  const editingEl = useMemo(
    () => (editingId ? elements.find((e) => e.id === editingId) : null),
    [editingId, elements]
  );

  return (
    <div
      ref={containerRef}
      className={className}
      onClick={isEditor ? () => selectCallbackRef.current?.(null) : undefined}
      style={{
        position: "relative", overflow: "hidden", ...bgStyle,
        ...(isEditor
          ? { width: "100%", maxWidth: deviceSizes[device]?.maxWidth || "1440px", margin: "0 auto", aspectRatio: `${BASE_W} / ${BASE_H}` }
          : { width: "100%", height: "100%" }),
      }}
    >
      {background.type === "image" && background.imageUrl && (
        <Image src={background.imageUrl} alt="" fill className="object-cover" priority sizes="100vw" />
      )}

      {visibleElements.map((el) => (
        <ElementRenderer
          key={el.id}
          el={el}
          isSelected={el.id === selectedId}
          isEditing={el.id === editingId}
          isEditor={isEditor}
          scale={scale}
          onSelect={selectCallbackRef.current!}
          onPointerDown={onPointerDown}
          onResizeDown={onResizeDown}
          onStartEditing={onStartEditing!}
        />
      ))}

      {editingEl && (
        <EditingTextarea
          el={editingEl}
          scale={scale}
          editText={editText}
          onEditTextChange={onEditTextChange}
          onFinishEditing={editingCallbackRef.current!}
        />
      )}
    </div>
  );
}
