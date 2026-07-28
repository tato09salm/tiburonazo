"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { BannerRenderer } from "@/components/banner/BannerRenderer";
import { CanvasToolbar } from "./panels/CanvasToolbar";
import { PropertiesPanel } from "./panels/PropertiesPanel";
import { BgUploader } from "./BgUploader";
import { CANVAS_WIDTH, CANVAS_HEIGHT, generateId } from "./types";
import type { CanvasElement, CanvasSlideData, CanvasBackground } from "./types";
import { buildData, autoFitTextHeight, autoFitButtonHeight } from "@/lib/canvas-utils";
import { toast } from "sonner";

interface Props {
  initialData?: CanvasSlideData | null;
  onChange: (data: CanvasSlideData) => void;
}

type Device = "desktop" | "tablet" | "mobile";

const DEVICES: { key: Device; label: string }[] = [
  { key: "desktop", label: "Desktop" },
  { key: "tablet", label: "Tablet" },
  { key: "mobile", label: "Mobile" },
];

const INITIAL_BG: CanvasBackground = { type: "color", color: "#1a1a2e" };

export function CanvasEditor({ initialData, onChange }: Props) {
  const [elements, setElements] = useState<CanvasElement[]>(
    () => (initialData?.elements?.length ? initialData.elements : [])
  );
  const [background, setBackground] = useState<CanvasBackground>(
    () => initialData?.background || INITIAL_BG
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [device, setDevice] = useState<Device>("desktop");

  const selectedElement = useMemo(
    () => elements.find((el) => el.id === selectedId) || null,
    [elements, selectedId]
  );

  const data = useMemo(
    () => buildData(background, elements),
    [background, elements]
  );

  const handleElementChange = useCallback(
    (id: string, attrs: Partial<CanvasElement>) => {
      let changed = false;
      const updated = elements.map((el) => {
        if (el.id !== id) return el;
        changed = true;
        const upd = { ...el } as any;
        Object.assign(upd, attrs);

        const a = attrs as any;
        const isText = el.type === "text" || el.type === "button";
        if (isText && (a.width !== undefined || a.text !== undefined || a.fontSize !== undefined)) {
          if (el.type === "button") {
            if (a.width !== undefined) {
              upd.height = autoFitButtonHeight(upd.fontSize || 16);
            }
          } else {
            upd.height = autoFitTextHeight(
              upd.width, upd.fontSize || 16, upd.lineHeight || 1.2, upd.text || ""
            );
          }
        }
        return upd as CanvasElement;
      });
      if (!changed) return;
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

  const handleBgChange = useCallback(
    (bg: CanvasBackground) => {
      setBackground(bg);
      onChange(buildData(bg, elements));
    },
    [elements, onChange]
  );

  const startEditing = useCallback((id: string) => {
    const el = elements.find((e) => e.id === id);
    if (!el || (el.type !== "text" && el.type !== "button")) return;
    setEditingId(id);
    setEditText(el.text || "");
  }, [elements]);

  const finishEditing = useCallback(() => {
    if (editingId) {
      handleElementChange(editingId, { text: editText || "" });
    }
    setEditingId(null);
    setEditText("");
  }, [editingId, editText, handleElementChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingId) return;
      const tag = (e.target as HTMLElement).tagName;
      if ((e.key === "Delete" || e.key === "Backspace") && tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") {
        e.preventDefault();
        deleteSelected();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingId, deleteSelected]);

  const handleSelectBgType = useCallback((t: "color" | "image" | "none") => {
    if (t === "color") handleBgChange({ type: "color", color: background.color || "#1a1a2e" });
    else if (t === "image") handleBgChange({ type: "image", imageUrl: background.imageUrl || "" });
    else handleBgChange({ type: "none" });
  }, [handleBgChange, background.color, background.imageUrl]);

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <CanvasToolbar
        onAddElement={addElement}
        onDeleteSelected={deleteSelected}
        onDuplicateSelected={duplicateSelected}
        hasSelection={!!selectedId}
      >
        {DEVICES.map((d) => (
          <button
            key={d.key}
            type="button"
            onClick={() => setDevice(d.key)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              device === d.key ? "bg-[#11ABC4] text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {d.label}
          </button>
        ))}
      </CanvasToolbar>

      <div className="flex" style={{ height: "calc(100vh - 280px)" }}>
        <div className="flex-1 bg-[#f0f4f8] flex flex-col items-center p-4 overflow-hidden gap-3">
          <div className="flex-1 flex items-center justify-center w-full min-h-0">
            <BannerRenderer
              data={data}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onElementChange={handleElementChange}
              editingId={editingId}
              editText={editText}
              onEditTextChange={setEditText}
              onFinishEditing={finishEditing}
              onStartEditing={startEditing}
              device={device}
              className="shadow-2xl rounded-xl"
            />
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
                  onClick={() => handleSelectBgType(t)}
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
                <input type="color" value={background.color || "#1a1a2e"}
                  onChange={(e) => handleBgChange({ ...background, color: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer border border-slate-200 shrink-0" />
                <input type="text" value={background.color || ""}
                  onChange={(e) => handleBgChange({ ...background, color: e.target.value })}
                  className="input text-sm py-1 flex-1" placeholder="#1a1a2e" />
              </div>
            )}
            {background.type === "image" && (
              <>
                <BgUploader currentUrl={background.imageUrl}
                  onUrl={(url) => handleBgChange({ ...background, imageUrl: url })} />
                <p className="text-[10px] text-gray-400 text-center leading-tight">Recomendado: 1440×720px</p>
              </>
            )}
          </div>
          <PropertiesPanel element={selectedElement} onChange={handleElementChange} />
        </div>
      </div>
    </div>
  );
}
