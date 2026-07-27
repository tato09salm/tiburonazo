"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Stage, Layer, Transformer, Rect, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import type { KonvaEventObject } from "konva/lib/Node";
import { TextElement } from "./elements/TextElement";
import { ImageElement } from "./elements/ImageElement";
import { ButtonElement } from "./elements/ButtonElement";
import { CanvasToolbar } from "./panels/CanvasToolbar";
import { PropertiesPanel } from "./panels/PropertiesPanel";
import { CANVAS_WIDTH, CANVAS_HEIGHT, generateId } from "./types";
import type { CanvasElement, CanvasSlideData, CanvasBackground } from "./types";
import { createPortal } from "react-dom";

interface Props {
  initialData?: CanvasSlideData | null;
  onChange: (data: CanvasSlideData) => void;
}

function BgImage({ url }: { url: string }) {
  const [image] = useImage(url);
  if (!image) return null;
  return <KonvaImage image={image} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />;
}

function BgColor({ color }: { color: string }) {
  return <Rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill={color} />;
}

function BgUploader({ currentUrl, onUrl }: { currentUrl?: string; onUrl: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "slides");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) onUrl(data.url);
    } catch {}
    setUploading(false);
  };

  return (
    <div>
      {currentUrl ? (
        <div className="relative group">
          <div className="w-full h-16 rounded-lg overflow-hidden bg-gray-100">
            <img src={currentUrl} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
            <label className="px-2 py-1 bg-white rounded text-xs cursor-pointer hover:bg-gray-100">
              Cambiar
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
            </label>
            <button onClick={() => onUrl("")} className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600">
              Quitar
            </button>
          </div>
        </div>
      ) : (
        <label className="flex items-center justify-center h-16 rounded-lg border-2 border-dashed border-slate-300 cursor-pointer hover:border-[#11ABC4] hover:bg-[#11ABC4]/5 transition-all text-xs text-gray-400">
          {uploading ? "Subiendo..." : "Subir imagen de fondo"}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
        </label>
      )}
    </div>
  );
}

function buildData(bg: CanvasBackground, els: CanvasElement[]): CanvasSlideData {
  return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT, background: bg, elements: els };
}

export function CanvasEditor({ initialData, onChange }: Props) {
  const [elements, setElements] = useState<CanvasElement[]>(
    initialData?.elements?.length ? initialData.elements : []
  );
  const [background, setBackground] = useState<CanvasBackground>(
    initialData?.background || { type: "color", color: "#1a1a2e" }
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stageScale, setStageScale] = useState(1);
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const resize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        setStageScale(w / CANVAS_WIDTH);
      }
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!stageRef.current || !transformerRef.current) return;
    if (selectedId) {
      const node = stageRef.current.findOne(`#${selectedId}`);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer()?.batchDraw();
        return;
      }
    }
    transformerRef.current.nodes([]);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedId, elements]);

  const selectedElement = elements.find((el) => el.id === selectedId) || null;

  const handleElementChange = useCallback(
    (id: string, attrs: Partial<CanvasElement>) => {
      const updated = elements.map((el) => (el.id === id ? ({ ...el, ...attrs } as CanvasElement) : el));
      setElements(updated);
      onChange(buildData(background, updated));
    },
    [elements, background, onChange]
  );

  const handleTransformEnd = useCallback(
    (id: string, attrs: { x: number; y: number; width: number; height: number; rotation: number }) => {
      const updated = elements.map((el) => (el.id === id ? ({ ...el, ...attrs } as CanvasElement) : el));
      setElements(updated);
      onChange(buildData(background, updated));
    },
    [elements, background, onChange]
  );

  const addElement = useCallback(
    (el: CanvasElement) => {
      const updated = [...elements, el];
      setElements(updated);
      setSelectedId(el.id);
      onChange(buildData(background, updated));
    },
    [elements, background, onChange]
  );

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    const updated = elements.filter((el) => el.id !== selectedId);
    setElements(updated);
    setSelectedId(null);
    onChange(buildData(background, updated));
  }, [selectedId, elements, background, onChange]);

  const duplicateSelected = useCallback(() => {
    if (!selectedId) return;
    const el = elements.find((e) => e.id === selectedId);
    if (!el) return;
    const copy = { ...el, id: generateId(), x: el.x + 20, y: el.y + 20 };
    const updated = [...elements, copy];
    setElements(updated);
    setSelectedId(copy.id);
    onChange(buildData(background, updated));
  }, [selectedId, elements, background, onChange]);

  const handleStageClick = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) setSelectedId(null);
  }, []);

  const handleBgChange = useCallback(
    (bg: CanvasBackground) => {
      setBackground(bg);
      onChange(buildData(bg, elements));
    },
    [elements, onChange]
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const editRef = useRef<HTMLTextAreaElement>(null);

  const startEditing = useCallback((id: string) => {
    const el = elements.find((e) => e.id === id);
    if (!el || (el.type !== "text" && el.type !== "button")) return;
    setEditingId(id);
    setEditText(el.text || "");
    setTimeout(() => {
      editRef.current?.focus();
      editRef.current?.select();
    }, 0);
  }, [elements]);

  const finishEditing = useCallback(() => {
    if (editingId && editText.trim()) {
      handleElementChange(editingId, { text: editText.trim() });
    }
    setEditingId(null);
    setEditText("");
  }, [editingId, editText, handleElementChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingId) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        const tag = (e.target as HTMLElement).tagName;
        if (tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") {
          e.preventDefault();
          deleteSelected();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingId, deleteSelected]);

  const renderElement = (el: CanvasElement) => {
    const isSelected = el.id === selectedId;
    const commonProps = {
      element: el,
      isSelected,
      onSelect: () => setSelectedId(el.id),
      onChange: (attrs: Partial<CanvasElement>) => handleElementChange(el.id, attrs),
      onTransformEnd: (attrs: { x: number; y: number; width: number; height: number; rotation: number }) =>
        handleTransformEnd(el.id, attrs),
      onDblClick: el.type === "text" || el.type === "button" ? () => startEditing(el.id) : undefined,
    };

    switch (el.type) {
      case "text":
        return <TextElement key={el.id} {...commonProps} />;
      case "image":
      case "gif":
        return <ImageElement key={el.id} {...commonProps} />;
      case "button":
        return <ButtonElement key={el.id} {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <CanvasToolbar
        onAddElement={addElement}
        onDeleteSelected={deleteSelected}
        onDuplicateSelected={duplicateSelected}
        hasSelection={!!selectedId}
      />

      <div className="flex" style={{ height: "calc(100vh - 280px)" }}>
        <div ref={containerRef} className="flex-1 bg-[#f0f4f8] flex items-center justify-center p-4 overflow-hidden">
          <div className="relative shadow-2xl rounded-xl overflow-hidden" style={{ width: "100%", aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}` }}>
            {/* Stage Konva */}
            <Stage
              ref={stageRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              scaleX={stageScale}
              scaleY={stageScale}
              onClick={handleStageClick as any}
              onTap={handleStageClick as any}
            >
              <Layer>
                {background.type === "image" && background.imageUrl && (
                  <BgImage url={background.imageUrl} />
                )}
                {background.type === "color" && background.color && (
                  <BgColor color={background.color} />
                )}
                {elements
                  .filter((el) => el.visible)
                  .sort((a, b) => a.zIndex - b.zIndex)
                  .map(renderElement)}
                <Transformer
                  ref={transformerRef}
                  rotateEnabled
                  borderStroke="#11ABC4"
                  borderStrokeWidth={2}
                  anchorFill="#11ABC4"
                  anchorSize={8}
                  anchorCornerRadius={2}
                  enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
                />
              </Layer>
            </Stage>
            {/* Inline text editing overlay */}
            {editingId && (() => {
              const el = elements.find(e => e.id === editingId);
              if (!el) return null;
              const edScale = stageScale;
              return (
                <textarea
                  ref={editRef}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onBlur={finishEditing}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      finishEditing();
                    }
                    if (e.key === "Escape") {
                      setEditingId(null);
                      setEditText("");
                    }
                  }}
                  className="absolute z-50 resize-none overflow-hidden bg-transparent border-2 border-[#11ABC4] rounded outline-none"
                  style={{
                    left: el.x * edScale,
                    top: el.y * edScale,
                    width: el.width * edScale,
                    height: el.height * edScale,
                    fontSize: ((el as any).fontSize || 24) * edScale,
                    fontFamily: (el as any).fontFamily || "Inter, sans-serif",
                    fontWeight: (el as any).fontWeight || "normal",
                    fontStyle: (el as any).fontStyle || "normal",
                    textAlign: (el as any).textAlign || "left",
                    color: (el as any).textColor || "#ffffff",
                    lineHeight: (el as any).lineHeight || 1.2,
                    padding: "4px",
                  }}
                />
              );
            })()}
          </div>
        </div>

        <div className="w-72 border-l border-slate-200 bg-white overflow-y-auto">
          <div className="p-4 border-b border-slate-100 space-y-2">
            <h3 className="font-heading text-sm font-bold text-gray-800">Fondo</h3>
            <div className="flex gap-2">
              {(["color", "image", "none"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    if (t === "color") handleBgChange({ type: "color", color: background.color || "#1a1a2e" });
                    else if (t === "image") handleBgChange({ type: "image", imageUrl: background.imageUrl || "" });
                    else handleBgChange({ type: "none" });
                  }}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    background.type === t
                      ? "border-[#11ABC4] bg-[#11ABC4]/10 text-[#11ABC4]"
                      : "border-slate-200 text-gray-500"
                  }`}
                >
                  {t === "color" ? "Color" : t === "image" ? "Imagen" : "Ninguno"}
                </button>
              ))}
            </div>
            {background.type === "color" && (
              <div className="flex gap-2">
                <input
                  type="color"
                  value={background.color || "#1a1a2e"}
                  onChange={(e) => handleBgChange({ ...background, color: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer border border-slate-200 shrink-0"
                />
                <input
                  type="text"
                  value={background.color || ""}
                  onChange={(e) => handleBgChange({ ...background, color: e.target.value })}
                  className="input text-sm py-1 flex-1"
                  placeholder="#1a1a2e"
                />
              </div>
            )}
            {background.type === "image" && (
              <BgUploader
                currentUrl={background.imageUrl}
                onUrl={(url) => handleBgChange({ ...background, imageUrl: url })}
              />
            )}
          </div>
          <PropertiesPanel element={selectedElement} onChange={handleElementChange} />
        </div>
      </div>
    </div>
  );
}
