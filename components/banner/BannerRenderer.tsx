"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CanvasSlideData, CanvasElement } from "@/components/admin/hero/canvas/types";

const BASE_W = 1440;
const BASE_H = 720;

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

export function BannerRenderer({
  data,
  className,
  selectedId,
  onSelect,
  onElementChange,
  editingId,
  editText,
  onEditTextChange,
  onFinishEditing,
  onStartEditing,
  device = "desktop",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const isEditor = !!onSelect;

  const dragRef = useRef<{
    id: string;
    startMouseX: number;
    startMouseY: number;
    startElX: number;
    startElY: number;
  } | null>(null);

  const resizeRef = useRef<{
    id: string;
    handle: string;
    startMouseX: number;
    startMouseY: number;
    startElX: number;
    startElY: number;
    startElW: number;
    startElH: number;
    startFontSize: number;
    startLineHeight: number;
    startLetterSpacing: number;
  } | null>(null);

  const scale = containerWidth ? containerWidth / BASE_W : 1;

  useEffect(() => {
    if (!containerRef.current) return;
    const measure = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const { background, elements } = data;

  const bgStyle: React.CSSProperties = {};
  if (background.type === "color") {
    bgStyle.backgroundColor = background.color;
  }

  useEffect(() => {
    if (!isEditor) return;
    const handleGlobalMove = (e: PointerEvent) => {
      if (dragRef.current) {
        const { id, startMouseX, startMouseY, startElX, startElY } = dragRef.current;
        const dx = (e.clientX - startMouseX) / scale;
        const dy = (e.clientY - startMouseY) / scale;
        onElementChange?.(id, {
          x: Math.round(startElX + dx),
          y: Math.round(startElY + dy),
        });
      }
      if (resizeRef.current) {
        const { id, handle, startMouseX, startMouseY, startElX, startElY, startElW, startElH, startFontSize, startLineHeight, startLetterSpacing } = resizeRef.current;
        const dx = (e.clientX - startMouseX) / scale;
        const dy = (e.clientY - startMouseY) / scale;

        const isCorner = ["top-left", "top-right", "bottom-left", "bottom-right"].includes(handle);

        if (isCorner) {
          // Corner: each frame computes from start values — no accumulation
          let newW = startElW + dx, newH = startElH + dy;
          let newX = startElX, newY = startElY;
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
          onElementChange?.(id, attrs);
        } else {
          // Edge: only change one dimension, no font scaling
          const attrs: any = {};
          switch (handle) {
            case "top-center": attrs.y = Math.round(startElY + dy); attrs.height = Math.max(20, Math.round(startElH - dy)); break;
            case "middle-left": attrs.x = Math.round(startElX + dx); attrs.width = Math.max(20, Math.round(startElW - dx)); break;
            case "middle-right": attrs.width = Math.max(20, Math.round(startElW + dx)); break;
            case "bottom-center": attrs.height = Math.max(20, Math.round(startElH + dy)); break;
          }
          onElementChange?.(id, attrs);
        }
      }
    };
    const handleGlobalUp = () => {
      dragRef.current = null;
      resizeRef.current = null;
    };
    window.addEventListener("pointermove", handleGlobalMove);
    window.addEventListener("pointerup", handleGlobalUp);
    return () => {
      window.removeEventListener("pointermove", handleGlobalMove);
      window.removeEventListener("pointerup", handleGlobalUp);
    };
  }, [isEditor, scale, onElementChange]);

  const handleElementPointerDown = useCallback((e: React.PointerEvent, el: CanvasElement) => {
    if (!onElementChange || el.locked) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      id: el.id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startElX: el.x,
      startElY: el.y,
    };
  }, [onElementChange]);

  const handleResizePointerDown = useCallback((e: React.PointerEvent, el: CanvasElement, handle: string) => {
    if (!onElementChange || el.locked) return;
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    resizeRef.current = {
      id: el.id,
      handle,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startElX: el.x,
      startElY: el.y,
      startElW: el.width,
      startElH: el.height,
      startFontSize: (el as any).fontSize ?? 16,
      startLineHeight: (el as any).lineHeight ?? 1.2,
      startLetterSpacing: (el as any).letterSpacing ?? 0,
    };
  }, [onElementChange]);

  const deviceSizes: Record<string, { maxWidth: string }> = {
    desktop: { maxWidth: "1440px" },
    tablet: { maxWidth: "768px" },
    mobile: { maxWidth: "390px" },
  };

  const renderElement = (el: CanvasElement) => {
    const isSelected = el.id === selectedId;
    const isEditing = el.id === editingId;
    const elStyle: React.CSSProperties = {
      position: "absolute",
      left: `${(el.x / BASE_W) * 100}%`,
      top: `${(el.y / BASE_H) * 100}%`,
      width: `${(el.width / BASE_W) * 100}%`,
      height: `${(el.height / BASE_H) * 100}%`,
      transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
      opacity: el.opacity,
      zIndex: el.zIndex + 10,
      ...(isEditor ? { cursor: el.locked ? "default" : "move" } : {}),
    };

    const content = (() => {
      const contentStyle: React.CSSProperties = isEditing ? { visibility: "hidden" } : {};
      switch (el.type) {
        case "text":
          return (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                ...contentStyle,
                fontFamily: el.fontFamily,
                fontSize: scale ? `${scale * el.fontSize}px` : `${el.fontSize}px`,
                fontWeight: el.fontWeight,
                fontStyle: el.fontStyle || undefined,
                color: el.textColor,
                textAlign: el.textAlign,
                letterSpacing: `${el.letterSpacing}px`,
                lineHeight: el.lineHeight,
                overflow: "hidden",
                textShadow: "0 2px 8px rgba(0,0,0,0.3)",
              }}
            >
              <span style={{ wordBreak: "break-word", maxWidth: "100%" }}>
                {el.text}
              </span>
            </div>
          );
        case "image":
        case "gif":
          return (
            <div style={{ position: "relative", width: "100%", height: "100%" }}>
              <Image
                src={el.src}
                alt=""
                fill
                className="drop-shadow-2xl"
                style={{ objectFit: el.fit || "contain" }}
                sizes="50vw"
              />
            </div>
          );
        case "button":
          return (
            <Link
              href={el.url || "#"}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: (el as any).textAlign === "left" ? "flex-start" : (el as any).textAlign === "right" ? "flex-end" : "center",
                textAlign: (el as any).textAlign || "center",
                width: "100%",
                height: "100%",
                backgroundColor: el.backgroundColor,
                color: el.textColor,
                borderRadius: `${el.borderRadius}px`,
                fontFamily: el.fontFamily,
                fontSize: scale ? `${scale * el.fontSize}px` : `${el.fontSize}px`,
                fontWeight: el.fontWeight,
                textDecoration: "none",
                ...contentStyle,
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
    })();

    return (
      <div
        key={el.id}
        style={elStyle}
        onPointerDown={isEditor ? (e) => handleElementPointerDown(e, el) : undefined}
        onClick={isEditor ? (e) => { e.stopPropagation(); onSelect(el.id); } : undefined}
        onDoubleClick={isEditor && onStartEditing ? () => onStartEditing(el.id) : undefined}
      >
        {content}
        {isSelected && isEditor && (
          <>
            <div
              style={{
                position: "absolute",
                inset: 0,
                border: "2px solid #11ABC4",
                borderRadius: "2px",
                pointerEvents: "none",
                zIndex: 60,
              }}
            />
            {HANDLES.map((h) => (
              <div
                key={h.key}
                onPointerDown={(e) => handleResizePointerDown(e, el, h.key)}
                style={{
                  position: "absolute",
                  top: h.top === 50 ? "50%" : `${h.top}%`,
                  left: h.left === 50 ? "50%" : `${h.left}%`,
                  width: 12,
                  height: 12,
                  backgroundColor: "#11ABC4",
                  border: "2px solid white",
                  borderRadius: 2,
                  transform: "translate(-50%, -50%)",
                  cursor: h.cursor,
                  zIndex: 70,
                }}
              />
            ))}
          </>
        )}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        ...bgStyle,
        ...(isEditor
          ? {
              width: "100%",
              maxWidth: deviceSizes[device]?.maxWidth || "1440px",
              margin: "0 auto",
              aspectRatio: `${BASE_W} / ${BASE_H}`,
            }
          : {
              width: "100%",
              height: "100%",
            }),
      }}
      onClick={isEditor ? () => onSelect?.(null) : undefined}
    >
      {background.type === "image" && background.imageUrl && (
        <Image src={background.imageUrl} alt="" fill className="object-cover" priority sizes="100vw" />
      )}

      {elements
        .filter((el) => el.visible)
        .sort((a, b) => a.zIndex - b.zIndex)
        .map(renderElement)}

      {editingId && (() => {
        const el = elements.find((e) => e.id === editingId);
        if (!el) return null;
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
              left: `${(el.x / BASE_W) * 100}%`,
              top: `${(el.y / BASE_H) * 100}%`,
              width: `${(el.width / BASE_W) * 100}%`,
              height: `${(el.height / BASE_H) * 100}%`,
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
      })()}
    </div>
  );
}
