"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { createProduct, updateProduct, upsertVariant, deleteVariant } from "@/actions/product.actions";
import { getBrands } from "@/actions/brand.actions";
import { GENDERS } from "@/lib/constants";
import { Plus, Trash2, Save, Loader2, Search, X, Upload, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandManager } from "./BrandManager";
import Image from "next/image";

interface Category { id: string; name: string }
interface Color { id: string; name: string }
interface Size { id: string; label: string; sortOrder: number; category?: string | null }
interface Brand { id: string; name: string }
interface Section { id: string; name: string }

interface Variant {
  id?: string;
  sku: string;
  colorId: string | null;
  sizeId: string | null;
  model: string | null;
  price: number;
  oldPrice: number | null;
  stock: number;
  color?: { name: string };
  size?: { label: string };
  isAutoSku?: boolean;
}

interface ProductImage {
  id?: string;
  url: string;
  alt?: string | null;
  order: number;
  colorId?: string | null;
}

interface ProductData {
  id?: string;
  code?: string;
  title?: string;
  description?: string | null;
  material?: string | null;
  linea?: string | null;
  gender?: string;
  weight?: number | null;
  categoryId?: string;
  brandId?: string | null;
  sectionId?: string | null;
  sections?: Array<{ id: string; name: string }>;
  isFeatured?: boolean;
  variants?: Variant[];
  images?: ProductImage[];
}

interface Props {
  categories: Category[];
  colors: Color[];
  sizes: Size[];
  brands: Brand[];
  sections: Section[];
  product?: ProductData;
}

const emptyVariant = (code: string = ""): Variant => ({
  sku: code.trim().toUpperCase().replace(/\s+/g, "-"),
  colorId: null,
  sizeId: null,
  model: null,
  price: 0,
  oldPrice: null,
  stock: 0,
  isAutoSku: true,
});

export function ProductForm({ categories, colors, sizes, brands: initialBrands, sections, product }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    brandId: product?.brandId ?? "",
    sectionValue: (() => {
      if (!product?.sections?.length) return "";
      
      const currentSectionIds = product.sections.map(s => s.id);
      
      // Buscar secciones por nombre para identificar combinaciones unisex
      const hombre = sections.find(s => s.name.toLowerCase() === "hombre");
      const mujer = sections.find(s => s.name.toLowerCase() === "mujer");
      const nino = sections.find(s => s.name.toLowerCase().includes("niño"));
      const nina = sections.find(s => s.name.toLowerCase().includes("niña"));

      // Caso Unisex Adulto: Tiene al menos Hombre y Mujer
      if (hombre && mujer && currentSectionIds.includes(hombre.id) && currentSectionIds.includes(mujer.id)) {
        return "UNISEX_ADULTO";
      }

      // Caso Unisex Niño: Tiene al menos Niño y Niña
      if (nino && nina && currentSectionIds.includes(nino.id) && currentSectionIds.includes(nina.id)) {
        return "UNISEX_NINO";
      }

      // Si no es ninguna combinación especial, mostrar la primera sección (o la única que tenga)
      return currentSectionIds[0] || "";
    })(),
    isFeatured: product?.isFeatured ?? false,
  });

  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [showBrandManager, setShowBrandManager] = useState(false);
  const [brandSearch, setBrandSearch] = useState("");
  const [showBrandList, setShowBrandList] = useState(false);

  const [variants, setVariants] = useState<Variant[]>(
    product?.variants?.length
      ? (product.variants as any[]).map((v) => ({ 
          ...v, 
          colorId: v.colorId ?? null, 
          sizeId: v.sizeId ?? null, 
          model: v.model ?? "", 
          oldPrice: v.oldPrice,
          isAutoSku: false
        }))
      : [emptyVariant(product?.code)]
  );

  const [images, setImages] = useState<ProductImage[]>(
    product?.images?.map((i) => ({ ...i })) ?? []
  );

  const [uploading, setUploading] = useState(false);
  const [isVariantDeleteModalOpen, setIsVariantDeleteModalOpen] = useState(false);
  const [variantIndexToDelete, setVariantIndexToDelete] = useState<number | null>(null);
  const [isDeletingVariant, setIsDeletingVariant] = useState(false);

  const filteredBrands = useMemo(() => {
    return brands.filter(b => b.name.toLowerCase().includes(brandSearch.toLowerCase()));
  }, [brands, brandSearch]);

  const selectedBrand = useMemo(() => {
    return brands.find(b => b.id === form.brandId);
  }, [brands, form.brandId]);

  async function refreshBrands() {
    const data = await getBrands();
    setBrands(data);
    
    // If selected brand was deleted, clear selection
    if (form.brandId && !data.find(b => b.id === form.brandId)) {
      setForm(f => ({ ...f, brandId: "" }));
    }
  }

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const val = e.target.value;
    setForm((f) => {
      const newForm = { ...f, [k]: val };
      if (k === "code") {
        setVariants(vs => vs.map(v => {
          if (v.isAutoSku) {
            return { ...v, sku: generateSKU(v, val) };
          }
          return v;
        }));
      }
      
      // Limpiar tallas si se cambia la categoría
      if (k === "categoryId") {
        const selectedCategory = categories.find(c => c.id === val);
        const categoryName = selectedCategory?.name || "";
        
        setVariants(vs => vs.map(v => {
          if (!v.sizeId) return v;
          
          const currentSize = sizes.find(s => s.id === v.sizeId);
          if (!currentSize) return { ...v, sizeId: null };
          
          const sizeCategories = currentSize.category 
            ? currentSize.category.split(",").map((c: string) => c.trim().toLowerCase()) 
            : [];
            
          const isDefault = sizeCategories.includes("default");
          const matchesCategory = sizeCategories.includes(categoryName.toLowerCase());
          
          if (!isDefault && !matchesCategory) {
            return { ...v, sizeId: null };
          }
          return v;
        }));
      }

      // Sincronizar gender automáticamente cuando cambie la sección
      if (k === "sectionValue") {
        if (val === "UNISEX_ADULTO") {
          newForm.gender = "ADULTO";
        } else if (val === "UNISEX_NINO") {
          newForm.gender = "NINO";
        } else if (val) {
          const selectedSection = sections.find(s => s.id === val);
          if (selectedSection) {
            const name = selectedSection.name.toLowerCase();
            if (name.includes("niño") || name.includes("niña")) {
              newForm.gender = "NINO";
            } else if (name.includes("bebe") || name.includes("bebé")) {
              newForm.gender = "BEBE";
            } else if (name.includes("hombre") || name.includes("mujer")) {
              newForm.gender = "ADULTO";
            }
          }
        }
      }
      
      return newForm;
    });
  };

  const filteredSizes = useMemo(() => {
    const selectedCategory = categories.find(c => c.id === form.categoryId);
    const categoryName = selectedCategory?.name || "";
    
    return sizes
      .filter(s => {
        const sizeCategories = s.category 
          ? s.category.split(",").map((c: string) => c.trim().toLowerCase()) 
          : [];
        
        return sizeCategories.includes("default") || sizeCategories.includes(categoryName.toLowerCase());
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [sizes, form.categoryId, categories]);

  function generateSKU(variant: Variant, productCode: string) {
    const parts = [productCode.trim()];
    
    if (variant.colorId) {
      const color = colors.find(c => c.id === variant.colorId);
      if (color) parts.push(color.name);
    }
    
    if (variant.sizeId) {
      const size = sizes.find(s => s.id === variant.sizeId);
      if (size) parts.push(size.label);
    }
    
    if (variant.model) {
      parts.push(variant.model);
    }
    
    return parts
      .filter(Boolean)
      .join("-")
      .toUpperCase()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function updateVariant(i: number, key: string, val: string | number | null) {
    setVariants((vs) => vs.map((v, idx) => {
      if (idx !== i) return v;
      
      let newVariant = { ...v, [key]: val };
      
      if (key === "sku") {
         newVariant.isAutoSku = false;
         newVariant.sku = String(val || "").toUpperCase().replace(/\s+/g, "-");
       } else if (["colorId", "sizeId", "model"].includes(key)) {
        if (newVariant.isAutoSku) {
          newVariant.sku = generateSKU(newVariant, form.code);
        }
      }
      
      return newVariant;
    }));
  }

  function handleOpenVariantDeleteModal(i: number) {
    const variant = variants[i];
    if (variant.id) {
      setVariantIndexToDelete(i);
      setIsVariantDeleteModalOpen(true);
    } else {
      // Si no tiene ID (es nueva), la eliminamos directamente
      setVariants((vs) => vs.filter((_, idx) => idx !== i));
    }
  }

  function handleCloseVariantDeleteModal() {
    setIsVariantDeleteModalOpen(false);
    setVariantIndexToDelete(null);
  }

  async function confirmDeleteVariant() {
    if (variantIndexToDelete === null) return;
    
    const variant = variants[variantIndexToDelete];
    if (!variant.id) return;

    setIsDeletingVariant(true);
    try {
      await deleteVariant(variant.id);
      setVariants((vs) => vs.filter((_, idx) => idx !== variantIndexToDelete));
      handleCloseVariantDeleteModal();
    } catch (err) {
      alert("Error al eliminar variante: " + (err instanceof Error ? err.message : "Error desconocido"));
    } finally {
      setIsDeletingVariant(false);
    }
  }

  async function removeVariant(i: number) {
    // This is now handled by handleOpenVariantDeleteModal and confirmDeleteVariant
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Error al subir imagen");
        const data = await res.json();
        
        setImages(prev => [
          ...prev, 
          { url: data.url, order: prev.length, colorId: null }
        ]);
      }
    } catch (err) {
      console.error(err);
      alert("Error al subir imagen");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function updateImageColor(i: number, colorId: string | null) {
    setImages(prev => prev.map((img, idx) => idx === i ? { ...img, colorId } : img));
  }

  function removeImage(i: number) {
    setImages(prev => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const skus = variants.map(v => v.sku.trim().toUpperCase()).filter(Boolean);
      const uniqueSkus = new Set(skus);
      if (skus.length !== uniqueSkus.size) {
        throw new Error("Los SKUs deben ser únicos");
      }

      // Mapear sección a IDs reales
      let sectionIds: string[] = [];
      if (form.sectionValue === "UNISEX_ADULTO") {
        sectionIds = sections
          .filter(s => s.name.toLowerCase() === "hombre" || s.name.toLowerCase() === "mujer")
          .map(s => s.id);
      } else if (form.sectionValue === "UNISEX_NINO") {
        sectionIds = sections
          .filter(s => s.name.toLowerCase() === "niño" || s.name.toLowerCase() === "niña")
          .map(s => s.id);
      } else if (form.sectionValue) {
        sectionIds = [form.sectionValue];
      }

      const vars = variants.filter((v) => v.sku && v.price > 0).map((v) => ({
        sku: v.sku,
        colorId: v.colorId || undefined,
        sizeId: v.sizeId || undefined,
        model: v.model || undefined,
        price: Number(v.price),
        oldPrice: v.oldPrice ? Number(v.oldPrice) : undefined,
        stock: Number(v.stock),
        ...(v.id && { id: v.id }),
      }));

      const imagesToSave = images.map((img, idx) => ({
        url: img.url,
        order: idx,
        colorId: img.colorId || undefined,
        ...(img.id && { id: img.id }),
      }));

      if (isEdit && product?.id) {
        await updateProduct(product.id, { 
          title: form.title, 
          description: form.description, 
          material: form.material, 
          linea: form.linea || null, 
          gender: form.gender as any, 
          isFeatured: form.isFeatured, 
          categoryId: form.categoryId,
          brandId: form.brandId || null,
          sectionIds,
          images: imagesToSave as any
        });
        for (const v of vars) await upsertVariant(product.id, v);
      } else {
        await createProduct({ 
          ...form, 
          brandId: form.brandId || undefined,
          sectionIds,
          linea: form.linea as any,
          gender: form.gender as any, 
          weight: form.weight ? Number(form.weight) : undefined, 
          variants: vars, 
          images: imagesToSave as any
        });
      }
      router.push("/admin/products");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {showBrandManager && (
        <BrandManager 
          onClose={() => setShowBrandManager(false)} 
          onRefresh={refreshBrands} 
        />
      )}

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre *</label>
                  <input value={form.title} onChange={update("title")} required className="input" placeholder="Nombre del producto" />
                </div>
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Marca</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <div 
                        className="input flex items-center justify-between cursor-pointer h-10 overflow-hidden"
                        onClick={() => setShowBrandList(!showBrandList)}
                      >
                        <span className={cn("truncate", !selectedBrand && "text-gray-400")}>
                          {selectedBrand ? selectedBrand.name : "Sin marca..."}
                        </span>
                        <Search size={14} className="text-gray-400 flex-shrink-0" />
                      </div>

                      {showBrandList && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col max-h-60">
                          <div className="p-2 border-b bg-gray-50 flex items-center gap-2">
                            <Search size={14} className="text-gray-400" />
                            <input 
                              value={brandSearch}
                              onChange={(e) => setBrandSearch(e.target.value)}
                              className="bg-transparent border-none outline-none text-xs w-full"
                              placeholder="Buscar marca..."
                              autoFocus
                            />
                          </div>
                          <div className="overflow-y-auto flex-1">
                            <button
                              type="button"
                              onClick={() => {
                                setForm(f => ({ ...f, brandId: "" }));
                                setShowBrandList(false);
                              }}
                              className="w-full text-left px-4 py-2 text-xs hover:bg-gray-100 text-gray-500 italic"
                            >
                              Sin marca
                            </button>
                            {filteredBrands.map(b => (
                              <button
                                key={b.id}
                                type="button"
                                onClick={() => {
                                  setForm(f => ({ ...f, brandId: b.id }));
                                  setShowBrandList(false);
                                }}
                                className={cn(
                                  "w-full text-left px-4 py-2 text-xs hover:bg-[#CCECFB] hover:text-[#11ABC4] transition-colors",
                                  form.brandId === b.id && "bg-[#CCECFB] text-[#11ABC4] font-bold"
                                )}
                              >
                                {b.name}
                              </button>
                            ))}
                            {filteredBrands.length === 0 && (
                              <p className="p-4 text-center text-xs text-gray-400">No hay marcas</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setShowBrandManager(true)}
                      className="btn-secondary p-2.5 h-10 flex items-center justify-center aspect-square"
                      title="Gestionar marcas"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  {showBrandList && <div className="fixed inset-0 z-40" onClick={() => setShowBrandList(false)} />}
                </div>
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
                  <input value={form.linea} onChange={update("linea")} className="input" placeholder="Verano 2026..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Sección *</label>
                  <select value={form.sectionValue} onChange={update("sectionValue")} required className="input">
                    <option value="">Seleccionar...</option>
                    <option value="UNISEX_ADULTO">Unisex Adulto</option>
                    <option value="UNISEX_NINO">Unisex Niño</option>
                    {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
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
                <button type="button" onClick={() => setVariants((v) => [...v, emptyVariant(form.code)])} className="btn-secondary text-sm px-3 py-1.5 flex items-center gap-1">
                  <Plus size={14} /> Agregar
                </button>
              </div>

              <div className="space-y-3">
                {/* Headers */}
                <div className="hidden md:grid md:grid-cols-7 gap-2 px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <div className="md:col-span-1">SKU</div>
                  <div>Color</div>
                  <div>Talla</div>
                  <div>Modelo</div>
                  <div>Precio</div>
                  <div>P. Anterior</div>
                  <div>Stock</div>
                </div>

                {variants.map((v, i) => (
                  <div key={i} className="grid grid-cols-2 md:grid-cols-7 gap-2 p-3 bg-gray-50 rounded-xl">
                    <input value={v.sku} onChange={(e) => updateVariant(i, "sku", e.target.value)} placeholder="SKU *" className="input text-xs md:col-span-1" />
                    
                    <select value={v.colorId ?? ""} onChange={(e) => updateVariant(i, "colorId", e.target.value || null)} className="input text-xs">
                      <option value="">Color</option>
                      {colors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>

                    <select value={v.sizeId ?? ""} onChange={(e) => updateVariant(i, "sizeId", e.target.value || null)} className="input text-xs">
                      <option value="">Talla</option>
                      {filteredSizes.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>

                    <input value={v.model ?? ""} onChange={(e) => updateVariant(i, "model", e.target.value || null)} placeholder="Modelo" className="input text-xs" />
                    <input type="number" value={v.price || ""} onChange={(e) => updateVariant(i, "price", e.target.value)} placeholder="Precio *" className="input text-xs" min={0} step={0.01} />
                    <input type="number" value={v.oldPrice ?? ""} onChange={(e) => updateVariant(i, "oldPrice", e.target.value || null)} placeholder="P. anterior" className="input text-xs" min={0} step={0.01} />
                    <div className="flex gap-1">
                      <input type="number" value={v.stock} onChange={(e) => updateVariant(i, "stock", Number(e.target.value))} placeholder="Stock" className="input text-xs flex-1" min={0} />
                      <button type="button" onClick={() => handleOpenVariantDeleteModal(i)} className="text-red-400 hover:text-red-600 px-1.5">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="space-y-5">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-lg font-bold">Imágenes</h2>
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
                >
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  Subir fotos
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept="image/*" 
                  multiple 
                  className="hidden" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {images.map((img, i) => (
                  <div key={i} className="relative group border border-gray-100 rounded-2xl overflow-hidden bg-gray-50 flex flex-col">
                    <div className="relative aspect-square w-full">
                      <Image src={img.url} alt={`Imagen ${i + 1}`} fill className="object-cover" quality={100} />
                      <button 
                        type="button" 
                        onClick={() => removeImage(i)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="p-2 bg-white border-t border-gray-50">
                      <select 
                        value={img.colorId ?? ""} 
                        onChange={(e) => updateImageColor(i, e.target.value || null)}
                        className="w-full text-[10px] py-1 border-none bg-gray-50 rounded font-medium focus:ring-0"
                      >
                        <option value="">Imagen general</option>
                        {colors.map(c => (
                          <option key={c.id} value={c.id}>Color: {c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
                {images.length === 0 && (
                  <div className="col-span-2 py-12 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center text-gray-400">
                    <ImageIcon size={32} className="mb-2 opacity-20" />
                    <p className="text-xs">No hay imágenes. Sube fotos del producto.</p>
                  </div>
                )}
              </div>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

            <button type="submit" disabled={loading || uploading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {loading ? "Guardando..." : isEdit ? "Actualizar producto" : "Crear producto"}
            </button>
          </div>
        </div>
      </form>

      {/* Modal for Variant Delete Confirmation */}
      {isVariantDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">¿Eliminar variante?</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Estás a punto de eliminar esta variante <span className="font-bold text-red-600">permanentemente</span> de la base de datos. Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex gap-3">
              <button
                type="button"
                onClick={handleCloseVariantDeleteModal}
                className="btn-secondary flex-1 h-11 text-sm font-semibold"
                disabled={isDeletingVariant}
              >
                cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteVariant}
                className="btn-primary bg-red-600 hover:bg-red-700 border-red-600 flex-1 h-11 text-sm font-semibold flex items-center justify-center gap-2"
                disabled={isDeletingVariant}
              >
                {isDeletingVariant ? (
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
