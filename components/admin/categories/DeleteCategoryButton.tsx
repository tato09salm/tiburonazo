"use client";

import { useState } from "react";
import { deleteCategory } from "@/actions/category.actions";
import { useRouter } from "next/navigation";
import { Trash2, X, Loader2 } from "lucide-react";

export function DeleteCategoryButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);
    try {
      await deleteCategory(id);
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al eliminar la categoría");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="text-gray-300 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50" 
        title="Eliminar"
      >
        <Trash2 size={15} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Eliminar Categoría</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                ¿Estás seguro de eliminar la categoría <span className="font-bold text-gray-900">"{name}"</span>? Esta acción no se puede deshacer.
              </p>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-left">
                  <X size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-600 font-medium leading-tight">
                    {error}
                  </p>
                </div>
              )}
            </div>
            <div className="bg-gray-50 px-6 py-4 flex gap-3">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setError(null);
                }}
                className="btn-secondary flex-1 h-11 text-sm font-semibold"
                disabled={loading}
              >
                cancelar
              </button>
              <button
                onClick={handleDelete}
                className="btn-primary bg-red-600 hover:bg-red-700 border-red-600 flex-1 h-11 text-sm font-semibold flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  "eliminar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
