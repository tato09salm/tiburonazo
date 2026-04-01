"use client";

import { useState } from "react";
import { createCategory } from "@/actions/category.actions";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface Cat { id: string; name: string }

export function CategoryForm({ parentCategories }: { parentCategories: Cat[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", description: "", imageUrl: "", parentId: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const update = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await createCategory({ name: form.name, description: form.description || undefined, imageUrl: form.imageUrl || undefined, parentId: form.parentId || undefined });
      setSuccess(true);
      setForm({ name: "", description: "", imageUrl: "", parentId: "" });
      setTimeout(() => { setSuccess(false); router.refresh(); }, 1500);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre *</label>
        <input value={form.name} onChange={update("name")} required className="input text-sm" placeholder="Ej: Ropa de baño" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Categoría padre (opcional)</label>
        <select value={form.parentId} onChange={update("parentId")} className="input text-sm">
          <option value="">Ninguna (categoría raíz)</option>
          {parentCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción</label>
        <textarea value={form.description} onChange={update("description")} className="input text-sm resize-none" rows={2} placeholder="Descripción breve..." />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">URL de imagen</label>
        <input value={form.imageUrl} onChange={update("imageUrl")} className="input text-sm" placeholder="https://..." />
      </div>
      <button type="submit" disabled={loading} className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${success ? "bg-green-500 text-white" : "btn-primary"}`}>
        {loading ? <Loader2 size={16} className="animate-spin" /> : success ? "✓ Creada" : "Crear categoría"}
      </button>
    </form>
  );
}
