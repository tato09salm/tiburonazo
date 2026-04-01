"use client";

import { deleteCategory } from "@/actions/category.actions";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function DeleteCategoryButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`¿Eliminar la categoría "${name}"? Los productos asociados quedarán sin categoría.`)) return;
    await deleteCategory(id);
    router.refresh();
  }

  return (
    <button onClick={handleDelete} className="text-gray-300 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50" title="Eliminar">
      <Trash2 size={15} />
    </button>
  );
}
