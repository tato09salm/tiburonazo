"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { BannerRenderer } from "@/components/banner/BannerRenderer";
import { CanvasToolbar } from "./panels/CanvasToolbar";
import { PropertiesPanel } from "./panels/PropertiesPanel";
import { CANVAS_WIDTH, CANVAS_HEIGHT, generateId } from "./types";
import type { CanvasElement, CanvasSlideData, CanvasBackground } from "./types";
import { toast } from "sonner";

interface Props {
  initialData?: CanvasSlideData | null;
  onChange: (data: CanvasSlideData) => void;
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

type Device = "desktop" | "tablet" | "mobile";

export function CanvasEditor({ initialData, onChange }: Props) {
  const [elements, setElements] = useState<CanvasElement[]>(
    initialData?.elements?.length ? initialData.elements : []
  );
  const [background, setBackground] = useState<CanvasBackground>(
    initialData?.background || { type: "color", color: "#1a1a2e" }
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [device, setDevice] = useState<Device>("desktop");

  const selectedElement = elements.find((el) => el.id === selectedId) || null;

  const handleElementChange = useCallback(
    (id: string, attrs: Partial<CanvasElement>) => {
      const updated = elements.map((el) => {
        if (el.id !== id) return el;
        const upd = { ...el } as any;
        Object.assign(upd, attrs);

        const isText = el.type === "text" || el.type === "button";

        // Auto-fit height when width, text, or fontSize changes
        const a = attrs as any;
        if (isText && (a.width !== undefined || a.text !== undefined || a.fontSize !== undefined)) {
          if (el.type === "button") {
            // Buttons are single-line; only auto-fit when width changes (keep height stable for text/font edits)
            if (a.width !== undefined) {
              const fs = upd.fontSize || 16;
              upd.height = Math.max(30, Math.round(fs * 1.5 + 12));
            }
          } else {
            const fs = upd.fontSize || 16;
            const lh = upd.lineHeight || 1.2;
            const text = upd.text || "";
            const cpl = Math.max(1, Math.round(upd.width / (fs * 0.6)));
            const lines = Math.max(1, Math.ceil(text.length / cpl));
            upd.height = Math.max(30, Math.round(lines * fs * lh + 12));
          }
        }

        return upd as CanvasElement;
      });
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
  }, [editingId, editText, elements, handleElementChange]);

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

  const data: CanvasSlideData = { width: CANVAS_WIDTH, height: CANVAS_HEIGHT, background, elements };

  const devices: { key: Device; label: string }[] = [
    { key: "desktop", label: "Desktop" },
    { key: "tablet", label: "Tablet" },
    { key: "mobile", label: "Mobile" },
  ];

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <CanvasToolbar
        onAddElement={addElement}
        onDeleteSelected={deleteSelected}
        onDuplicateSelected={duplicateSelected}
        hasSelection={!!selectedId}
      >
        {devices.map((d) => (
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
          {/* BannerRenderer — same component used in store */}
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
              <>
                <BgUploader
                  currentUrl={background.imageUrl}
                  onUrl={(url) => handleBgChange({ ...background, imageUrl: url })}
                />
                <p className="text-[10px] text-gray-400 text-center leading-tight">
                  Recomendado: 1440×720px
                </p>
              </>
            )}
          </div>
          <PropertiesPanel element={selectedElement} onChange={handleElementChange} />
        </div>
      </div>
    </div>
  );
}
