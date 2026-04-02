"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct, updateProduct, upsertVariant } from "@/actions/product.actions";
import { GENDERS } from "@/lib/constants";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category { id: string; name: string }
interface Variant { id?: string; sku: string; color: string | null; size: string | null; model: string | null; price: number; oldPrice: number | null; stock: number }
interface ProductData {
  id?: string;
  code?: string; title?: string; description?: string | null; material?: string | null;
  linea?: string | null; gender?: string; weight?: number | null;
  categoryId?: string; brandId?: string | null; isFeatured?: boolean;
  variants?: Variant[];
  images?: { url: string; alt?: string | null; order: number }[];
}

interface Props { categories: Category[]; product?: ProductData }

const emptyVariant = (): Variant => ({ sku: "", color: null, size: null, model: null, price: 0, oldPrice: null, stock: 0 });

export function ProductForm({ categories, product }: Props) {
  const router = useRouter();
  const isEdit = !!product?.id;

  const [form, setForm] = useState({
    code: product?.code ?? "",
    title: product?.title ?? "",
    description: product?.description ?? "",
    material: product?.material ?? "",
    linea: product?.linea ?? "",
    gender: product?.gender ?? "UNISEX",
    weight: product?.weight ?? "",
    categoryId: product?.categoryId ?? "",
    isFeatured: product?.isFeatured ?? false,
  });

  const [variants, setVariants] = useState<Variant[]>(
    product?.variants?.length
      ? product.variants.map((v) => ({ ...v, color: v.color ?? "", size: v.size ?? "", model: v.model ?? "", oldPrice: v.oldPrice }))
      : [emptyVariant()]
  );

  const [imageUrls, setImageUrls] = useState<string[]>(
    product?.images?.map((i) => i.url) ?? [""]
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function updateVariant(i: number, key: string, val: string | number | null) {
    setVariants((vs) => vs.map((v, idx) => idx === i ? { ...v, [key]: val } : v));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const images = imageUrls.filter(Boolean).map((url, order) => ({ url, order }));
      const vars = variants.filter((v) => v.sku && v.price > 0).map((v) => ({
        sku: v.sku,
        color: v.color || undefined,
        size: v.size || undefined,
        model: v.model || undefined,
        price: Number(v.price),
        oldPrice: v.oldPrice ? Number(v.oldPrice) : undefined,
        stock: Number(v.stock),
        ...(v.id && { id: v.id }),
      }));

      if (isEdit && product?.id) {
        await updateProduct(product.id, { title: form.title, description: form.description, material: form.material, linea: form.linea, gender: form.gender as never, isFeatured: form.isFeatured, categoryId: form.categoryId });
        for (const v of vars) await upsertVariant(product.id, v);
      } else {
        await createProduct({ ...form, gender: form.gender as never, weight: form.weight ? Number(form.weight) : undefined, variants: vars, images });
      }
      router.push("/admin/products");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card p-6 space-y-4">
            <h2 className="font-heading text-lg font-bold">Información general</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Código *</label>
                <input value={form.code} onChange={update("code")} required className="input" placeholder="P001" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Categoría *</label>
                <select value={form.categoryId} onChange={update("categoryId")} required className="input">
                  <option value="">Seleccionar...</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Título *</label>
              <input value={form.title} onChange={update("title")} required className="input" placeholder="Nombre del producto" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción</label>
              <textarea value={form.description} onChange={update("description")} className="input min-h-[80px] resize-none" placeholder="Descripción del producto..." />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Material</label>
                <input value={form.material} onChange={update("material")} className="input" placeholder="Licra, Poliéster..." />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Línea</label>
                <input value={form.linea} onChange={update("linea")} className="input" placeholder="Competencia..." />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Público</label>
                <select value={form.gender} onChange={update("gender")} className="input">
                  {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))} className="accent-[#11ABC4] w-4 h-4" />
              <span className="text-sm font-medium">Producto destacado (aparece en el home)</span>
            </label>
          </div>

          {/* Variants */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-bold">Variantes</h2>
              <button type="button" onClick={() => setVariants((v) => [...v, emptyVariant()])} className="btn-secondary text-sm px-3 py-1.5 flex items-center gap-1">
                <Plus size={14} /> Agregar
              </button>
            </div>

            <div className="space-y-3">
              {variants.map((v, i) => (
                <div key={i} className="grid grid-cols-2 md:grid-cols-7 gap-2 p-3 bg-gray-50 rounded-xl">
                  <input value={v.sku} onChange={(e) => updateVariant(i, "sku", e.target.value)} placeholder="SKU *" className="input text-xs md:col-span-1" />
                  <input value={v.color ?? ""} onChange={(e) => updateVariant(i, "color", e.target.value || null)} placeholder="Color" className="input text-xs" />
                  <input value={v.size ?? ""} onChange={(e) => updateVariant(i, "size", e.target.value || null)} placeholder="Talla" className="input text-xs" />
                  <input value={v.model ?? ""} onChange={(e) => updateVariant(i, "model", e.target.value || null)} placeholder="Modelo" className="input text-xs" />
                  <input type="number" value={v.price || ""} onChange={(e) => updateVariant(i, "price", e.target.value)} placeholder="Precio *" className="input text-xs" min={0} step={0.01} />
                  <input type="number" value={v.oldPrice ?? ""} onChange={(e) => updateVariant(i, "oldPrice", e.target.value || null)} placeholder="P. anterior" className="input text-xs" min={0} step={0.01} />
                  <div className="flex gap-1">
                    <input type="number" value={v.stock} onChange={(e) => updateVariant(i, "stock", Number(e.target.value))} placeholder="Stock" className="input text-xs flex-1" min={0} />
                    {variants.length > 1 && (
                      <button type="button" onClick={() => setVariants((vs) => vs.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 px-1.5">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="space-y-5">
          <div className="card p-6">
            <h2 className="font-heading text-lg font-bold mb-4">Imágenes</h2>
            <div className="space-y-2">
              {imageUrls.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <input value={url} onChange={(e) => setImageUrls((imgs) => imgs.map((u, idx) => idx === i ? e.target.value : u))} placeholder={`URL imagen ${i + 1}`} className="input text-xs flex-1" />
                  {imageUrls.length > 1 && (
                    <button type="button" onClick={() => setImageUrls((imgs) => imgs.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setImageUrls((imgs) => [...imgs, ""])} className="text-[#11ABC4] text-xs flex items-center gap-1 hover:underline">
                <Plus size={12} /> Agregar imagen
              </button>
            </div>

            {/* Preview first image */}
            {imageUrls[0] && (
              <div className="mt-4 relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                <img src={imageUrls[0]} alt="preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
              </div>
            )}
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {loading ? "Guardando..." : isEdit ? "Actualizar producto" : "Crear producto"}
          </button>
        </div>
      </div>
    </form>
  );
}
