"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { createHeroSlide, updateHeroSlide } from "@/actions/hero.actions";
import { CanvasEditor } from "./canvas/CanvasEditor";
import type { HeroSlide } from "@prisma/client";
import type { CanvasSlideData } from "./canvas/types";
import { toast } from "sonner";

interface Props {
  slide?: HeroSlide;
}

export function HeroSlideForm({ slide }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(slide?.title || "");
  const [isActive, setIsActive] = useState(slide?.isActive ?? true);
  const [order, setOrder] = useState(slide?.order ?? 0);
  const [displayDuration, setDisplayDuration] = useState(slide?.displayDuration ?? 5);
  const [canvasData, setCanvasData] = useState<CanvasSlideData | null>(
    slide?.canvasData ? (slide.canvasData as unknown as CanvasSlideData) : null
  );
  const [saving, setSaving] = useState(false);
  const [titleError, setTitleError] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      setTitleError(true);
      toast.error("El título es obligatorio");
      return;
    }
    setTitleError(false);
    setSaving(true);
    try {
      const data = {
        title: title.trim(),
        subtitle: null,
        description: null,
        badge: null,
        button1Text: null,
        button1Url: null,
        button2Text: null,
        button2Url: null,
        imageUrl: null,
        gifUrl: null,
        backgroundImageUrl: null,
        backgroundColor: null,
        textColor: "#FFFFFF",
        buttonColor: "#11ABC4",
        contentPosition: "LEFT" as const,
        isActive,
        order: Number(order),
        displayDuration: Number(displayDuration),
        canvasData: canvasData,
      };

      if (slide) {
        await updateHeroSlide(slide.id, data);
        toast.success("Slide actualizado");
      } else {
        await createHeroSlide(data);
        toast.success("Slide creado");
      }
      router.push("/admin/hero");
      router.refresh();
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Error al guardar el slide");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center gap-4 flex-wrap bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Título del slide</label>
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setTitleError(false); }}
            className={`input text-sm ${titleError ? "border-red-400 ring-1 ring-red-300" : ""}`}
            placeholder="Ej: Colección Verano 2026"
          />
        </div>
        <div className="w-24">
          <label className="block text-xs font-medium text-gray-500 mb-1">Orden</label>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            className="input text-sm py-1.5"
          />
        </div>
        <div className="w-32">
          <label className="block text-xs font-medium text-gray-500 mb-1">Duración</label>
          <select
            value={displayDuration}
            onChange={(e) => setDisplayDuration(Number(e.target.value))}
            className="input text-sm py-1.5"
          >
            <option value={3}>3 seg</option>
            <option value={5}>5 seg</option>
            <option value={7}>7 seg</option>
            <option value={10}>10 seg</option>
          </select>
        </div>
        <div className="flex items-center gap-3 pt-4">
          <label className="text-xs font-medium text-gray-500">Activo</label>
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={cn(
              "relative w-10 h-5 rounded-full transition-colors",
              isActive ? "bg-green-500" : "bg-gray-300"
            )}
          >
            <div className={cn(
              "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
              isActive && "translate-x-5"
            )} />
          </button>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2 text-sm py-2.5 ml-auto"
        >
          {saving ? (
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <Save size={16} />
          )}
          {slide ? "Guardar" : "Crear slide"}
        </button>
      </div>

      {/* Canvas Editor */}
      <CanvasEditor
        initialData={canvasData}
        onChange={setCanvasData}
      />
    </div>
  );
}
