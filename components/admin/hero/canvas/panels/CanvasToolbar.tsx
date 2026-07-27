"use client";

import { useRef } from "react";
import { Type, Image as ImageIcon, MousePointer2, SquareStack, Trash2, Copy } from "lucide-react";
import { createDefaultText, createDefaultButton } from "../types";
import type { CanvasElement } from "../types";

interface Props {
  onAddElement: (el: CanvasElement) => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  hasSelection: boolean;
}

export function CanvasToolbar({ onAddElement, onDeleteSelected, onDuplicateSelected, hasSelection }: Props) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const gifInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File, isGif: boolean) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "slides");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        const img = new window.Image();
        img.onload = () => {
          const aspect = img.width / img.height;
          const w = 400;
          const h = w / aspect;
          onAddElement({
            id: `el_${Date.now()}`,
            type: isGif ? "gif" : "image",
            x: 500,
            y: 100,
            width: w,
            height: h,
            rotation: 0,
            zIndex: 1,
            opacity: 1,
            visible: true,
            locked: false,
            src: data.url,
            fit: "contain",
          } as CanvasElement);
        };
        img.src = data.url;
      }
    } catch {}
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-white border-b border-slate-200 flex-wrap">
      <button
        type="button"
        onClick={() => onAddElement(createDefaultText() as CanvasElement)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 text-gray-600 hover:border-[#11ABC4] hover:text-[#11ABC4] hover:bg-[#11ABC4]/5 transition-all"
      >
        <Type size={16} /> Texto
      </button>
      <button
        type="button"
        onClick={() => imageInputRef.current?.click()}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 text-gray-600 hover:border-[#11ABC4] hover:text-[#11ABC4] hover:bg-[#11ABC4]/5 transition-all"
      >
        <ImageIcon size={16} /> Imagen
      </button>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageUpload(file, false);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => gifInputRef.current?.click()}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 text-gray-600 hover:border-[#11ABC4] hover:text-[#11ABC4] hover:bg-[#11ABC4]/5 transition-all"
      >
        GIF
      </button>
      <input
        ref={gifInputRef}
        type="file"
        accept="image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageUpload(file, true);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => onAddElement(createDefaultButton() as CanvasElement)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 text-gray-600 hover:border-[#11ABC4] hover:text-[#11ABC4] hover:bg-[#11ABC4]/5 transition-all"
      >
        <MousePointer2 size={16} /> Botón
      </button>

      <div className="w-px h-6 bg-slate-200 mx-2" />

      <button
        type="button"
        onClick={onDuplicateSelected}
        disabled={!hasSelection}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-slate-200 text-gray-400 disabled:opacity-30 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
      >
        <Copy size={16} /> Duplicar
      </button>
      <button
        type="button"
        onClick={onDeleteSelected}
        disabled={!hasSelection}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-slate-200 text-gray-400 disabled:opacity-30 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all"
      >
        <Trash2 size={16} /> Eliminar
      </button>
    </div>
  );
}
