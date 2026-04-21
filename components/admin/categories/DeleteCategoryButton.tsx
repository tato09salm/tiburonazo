"use client";

import { useState } from "react";
import { deleteCategory } from "@/actions/category.actions";
import { useRouter } from "next/navigation";
import { Trash2, X, Loader2 } from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

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

      <ConfirmModal 
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setError(null);
        }}
        onConfirm={handleDelete}
        title="Eliminar Categoría"
        message={`¿Estás seguro de eliminar la categoría "${name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        loading={loading}
      />
    </>
  );
}
