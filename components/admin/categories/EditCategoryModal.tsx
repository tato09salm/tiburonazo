"use client";

import { useState } from "react";
import { updateCategory } from "@/actions/category.actions";
import { useRouter } from "next/navigation";
import { Pencil, X, Loader2, Save } from "lucide-react";

interface Props {
  id: string;
  name: string;
}

export function EditCategoryModal({ id, name: initialName }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await updateCategory(id, { name });
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al actualizar la categoría");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="text-gray-300 hover:text-blue-500 transition-colors p-1.5 rounded-lg hover:bg-blue-50" 
        title="Editar"
      >
        <Pencil size={15} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-4 border-b flex items-center justify-between bg-gray-50">
              <h3 className="font-heading font-bold text-gray-800">Editar Categoría</h3>
              <button 
                onClick={() => {
                  setIsOpen(false);
                  setError(null);
                  setName(initialName);
                }} 
                className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">Nombre de la Categoría</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Ropa Deportiva, Accesorios..."
                  className="input w-full h-11 text-sm"
                  autoFocus
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-left">
                  <X size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-600 font-medium leading-tight">
                    {error}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setError(null);
                    setName(initialName);
                  }}
                  className="btn-secondary flex-1 h-11 text-sm font-semibold"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim() || name === initialName}
                  className="btn-primary flex-1 h-11 text-sm font-semibold flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
