"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Plus, Pencil, Copy, Trash2, EyeOff, Eye, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleHeroSlideStatus, deleteHeroSlide, duplicateHeroSlide, reorderHeroSlides } from "@/actions/hero.actions";
import type { HeroSlide } from "@prisma/client";
import { toast } from "sonner";

interface Props {
  initialSlides: HeroSlide[];
}

export function HeroSlideList({ initialSlides }: Props) {
  const [slides, setSlides] = useState(initialSlides);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const dragItem = useRef<number | null>(null);
  const router = useRouter();

  const handleDragStart = useCallback((idx: number) => {
    dragItem.current = idx;
    setDragIdx(idx);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setOverIdx(idx);
  }, []);

  const handleDragEnd = useCallback(async () => {
    if (dragItem.current === null || overIdx === null || dragItem.current === overIdx) {
      setDragIdx(null);
      setOverIdx(null);
      dragItem.current = null;
      return;
    }

    const updated = [...slides];
    const [moved] = updated.splice(dragItem.current, 1);
    updated.splice(overIdx, 0, moved);
    setSlides(updated);
    setDragIdx(null);
    setOverIdx(null);
    dragItem.current = null;

    try {
      await reorderHeroSlides(updated.map((s) => s.id));
      toast.success("Orden actualizado");
    } catch {
      toast.error("Error al reordenar");
    }
  }, [slides, overIdx]);

  const handleToggle = async (id: string) => {
    try {
      await toggleHeroSlideStatus(id);
      setSlides((prev) => prev.map((s) => s.id === id ? { ...s, isActive: !s.isActive } : s));
      toast.success("Estado actualizado");
      router.refresh();
    } catch {
      toast.error("Error al actualizar");
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`¿Eliminar "${title}"?`)) return;
    try {
      await deleteHeroSlide(id);
      setSlides((prev) => prev.filter((s) => s.id !== id));
      toast.success("Slide eliminado");
      router.refresh();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateHeroSlide(id);
      toast.success("Slide duplicado");
      router.refresh();
    } catch {
      toast.error("Error al duplicar");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-gray-900">Hero Slider</h1>
          <p className="text-gray-500 text-sm mt-1">{slides.length} slides en total</p>
        </div>
        <Link href="/admin/hero/new" className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Nuevo slide
        </Link>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="w-10 px-2"></th>
                <th className="px-4 py-3 text-left whitespace-nowrap">Slide</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">Título</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">Estado</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">Orden</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">Actualizado</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {slides.map((slide, idx) => {
                const thumb = slide.imageUrl || slide.gifUrl || slide.backgroundImageUrl;
                return (
                  <tr
                    key={slide.id}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "hover:bg-gray-50 transition-colors",
                      dragIdx === idx && "opacity-50 bg-blue-50",
                      overIdx === idx && dragIdx !== idx && "border-t-2 border-[#11ABC4]"
                    )}
                  >
                    <td className="px-2 py-3 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
                      <GripVertical size={16} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative w-16 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {thumb ? (
                          <Image
                            src={thumb}
                            alt={slide.title}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            Sin img
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">
                      {slide.title}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "badge",
                        slide.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      )}>
                        {slide.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{slide.order}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(slide.updatedAt).toLocaleDateString("es-PE", {
                        day: "2-digit", month: "2-digit", year: "numeric",
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/hero/${slide.id}/edit`}
                          className="p-2 rounded-lg text-gray-400 hover:bg-[#11ABC4]/10 hover:text-[#11ABC4] transition-colors"
                          aria-label="Editar"
                        >
                          <Pencil size={16} />
                        </Link>
                        <button
                          onClick={() => handleDuplicate(slide.id)}
                          className="p-2 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          aria-label="Duplicar"
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          onClick={() => handleToggle(slide.id)}
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            slide.isActive
                              ? "text-gray-400 hover:bg-amber-50 hover:text-amber-600"
                              : "text-gray-400 hover:bg-green-50 hover:text-green-600"
                          )}
                          aria-label={slide.isActive ? "Desactivar" : "Activar"}
                        >
                          {slide.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          onClick={() => handleDelete(slide.id, slide.title)}
                          className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          aria-label="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {slides.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    <p className="text-lg mb-2">No hay slides aún</p>
                    <Link href="/admin/hero/new" className="text-[#11ABC4] hover:underline font-semibold">
                      Crear primer slide
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
