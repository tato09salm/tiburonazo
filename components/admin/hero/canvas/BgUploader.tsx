"use client";

import { useState } from "react";

interface Props {
  currentUrl?: string;
  onUrl: (url: string) => void;
}

export function BgUploader({ currentUrl, onUrl }: Props) {
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
