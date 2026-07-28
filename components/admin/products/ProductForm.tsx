"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createProduct, updateProduct, upsertVariant, deleteVariant, getNextProductCode } from "@/actions/product.actions";
import { getBrands } from "@/actions/brand.actions";
import { Plus, Trash2, Save, Loader2, Search, X, Upload, Image as ImageIcon, GalleryHorizontalEnd, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandManager } from "./BrandManager";
import { CustomColorModal } from "./CustomColorModal";
import Image from "next/image";
import { toast } from "sonner";

interface Category { id: string; name: string }
interface Color { id: string; name: string; hex?: string | null; swatchUrl?: string | null }
interface Size { id: string; label: string; sortOrder: number; category?: string | null }
interface Brand { id: string; name: string }
interface Section { id: string; name: string; slug: string }

interface Variant {
  id?: string;
  sku: string;
  colorId: string | null;
  sizeId: string | null;
  model: string | null;
  price: number;
  oldPrice: number | null;
  stock: number;
  isOutlet: boolean;
  sectionIds: string[];
  imageKeys: string[];
  color?: { id?: string; name: string };
  size?: { id?: string; label: string };
  sections?: { id: string; name: string }[];
  isAutoSku?: boolean;
}

interface ProductImage {
  id?: string;
  _key?: string;
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
  weight?: number | null;
  categoryId?: string;
  brandId?: string | null;
  isFeatured?: boolean;
  variants?: (Variant & { productImage?: { id: string; url: string } | null; allImages?: { id: string; url: string }[] })[];
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

const tempKey = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `tmp-${Math.random().toString(36).slice(2, 10)}`);

const emptyVariant = (code: string = "", defaultSectionIds: string[] = []): Variant => ({
  sku: code.trim().toUpperCase().replace(/\s+/g, "-"),
  colorId: null,
  sizeId: null,
  model: null,
  price: 0,
  oldPrice: null,
  stock: 0,
  isOutlet: false,
  sectionIds: [...defaultSectionIds],
  imageKeys: [],
  isAutoSku: true,
});

export function ProductForm({ categories, colors: initialColors, sizes, brands: initialBrands, sections, product }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingVariantImageIdxRef = useRef<number | null>(null);
  const isEdit = !!product?.id;

  const defaultSectionIds: string[] = [];
  const [colors, setColors] = useState<Color[]>(initialColors);
  const [isCustomColorModalOpen, setIsCustomColorModalOpen] = useState(false);
  const [customColorForVariant, setCustomColorForVariant] = useState<number | null>(null);

  const [form, setForm] = useState({
    code: product?.code ?? "",
    title: product?.title ?? "",
    description: product?.description ?? "",
    material: product?.material ?? "",
    linea: product?.linea ?? "",
    weight: product?.weight ?? "",
    categoryId: product?.categoryId ?? "",
    brandId: product?.brandId ?? "",
    isFeatured: product?.isFeatured ?? false,
  });

  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [showBrandManager, setShowBrandManager] = useState(false);
  const [brandSearch, setBrandSearch] = useState("");
  const [showBrandList, setShowBrandList] = useState(false);

  const initialImages: ProductImage[] = product?.images?.map((i) => ({ ...i, _key: i.id ?? tempKey() })) ?? [];

  const [variants, setVariants] = useState<Variant[]>(() => {
    if (product?.variants?.length) {
      return product.variants.map((v) => {
        const explicitKeys = (v.allImages || []).map(img => img.id).filter(Boolean) as string[];
        const legacyKey = v.productImage?.id;
        const merged = Array.from(new Set([...explicitKeys, ...(legacyKey ? [legacyKey] : [])])).filter(Boolean);
        return {
          ...v,
          colorId: v.colorId ?? null,
          sizeId: v.sizeId ?? null,
          model: v.model ?? "",
          oldPrice: v.oldPrice,
          isOutlet: v.isOutlet ?? false,
          sectionIds: v.sections?.map((s) => s.id) ?? [],
          imageKeys: merged,
          isAutoSku: false,
        };
      });
    }
    return [emptyVariant(product?.code, defaultSectionIds)];
  });

  const [images, setImages] = useState<ProductImage[]>(initialImages);

  const [uploading, setUploading] = useState(false);
  const [isVariantDeleteModalOpen, setIsVariantDeleteModalOpen] = useState(false);
  const [variantIndexToDelete, setVariantIndexToDelete] = useState<number | null>(null);
  const [isDeletingVariant, setIsDeletingVariant] = useState(false);
  const [galleryOpenForVariant, setGalleryOpenForVariant] = useState<number | null>(null);
  const [isImageDeleteModalOpen, setIsImageDeleteModalOpen] = useState(false);
  const [imageKeyToDelete, setImageKeyToDelete] = useState<string | null>(null);
  const [imageDeleteUsingCount, setImageDeleteUsingCount] = useState(0);
  const [isVariantImageDeleteModalOpen, setIsVariantImageDeleteModalOpen] = useState(false);
  const [variantImageToDelete, setVariantImageToDelete] = useState<{ variantIdx: number; imageKey: string; usingCount: number; isShared: boolean } | null>(null);

  const [stockDraft, setStockDraft] = useState<Record<number, string>>(() => {
    const init: Record<number, string> = {};
    const list = product?.variants?.length ? product.variants : [null];
    list.forEach((v: any, i: number) => {
      const n = Number(v?.stock ?? 0);
      init[i] = Number.isFinite(n) ? String(n) : "0";
    });
    return init;
  });

  const filteredBrands = useMemo(() => {
    return brands.filter(b => b.name.toLowerCase().includes(brandSearch.toLowerCase()));
  }, [brands, brandSearch]);

  const selectedBrand = useMemo(() => {
    return brands.find(b => b.id === form.brandId);
  }, [brands, form.brandId]);

  async function refreshBrands() {
    const data = await getBrands();
    setBrands(data);

    if (form.brandId && !data.find(b => b.id === form.brandId)) {
      setForm(f => ({ ...f, brandId: "" }));
    }
  }

  function handleCustomColorCreated(newColor: Color) {
    setColors((prev) => [...prev, newColor].sort((a, b) => a.name.localeCompare(b.name)));
    if (customColorForVariant !== null) {
      updateVariant(customColorForVariant, "colorId", newColor.id);
    }
    setCustomColorForVariant(null);
  }

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEdit) {
      const fetchNextCode = async () => {
        const nextCode = await getNextProductCode();
        if (nextCode) {
          setForm(f => ({ ...f, code: nextCode }));
          setVariants(vs => vs.map(v => v.isAutoSku ? { ...v, sku: generateSKU(v, nextCode) } : v));
        }
      };
      fetchNextCode();
    }
  }, [isEdit]);

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

  function updateVariant(i: number, key: string, val: any) {
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

  function toggleVariantSection(i: number, sectionId: string) {
    setVariants((vs) => vs.map((v, idx) => {
      if (idx !== i) return v;
      const has = v.sectionIds.includes(sectionId);
      return {
        ...v,
        sectionIds: has
          ? v.sectionIds.filter((s) => s !== sectionId)
          : [...v.sectionIds, sectionId],
      };
    }));
  }

  function handleOpenVariantDeleteModal(i: number) {
    const variant = variants[i];
    if (variant.id) {
      setVariantIndexToDelete(i);
      setIsVariantDeleteModalOpen(true);
    } else {
      setVariants((vs) => vs.filter((_, idx) => idx !== i));
      setStockDraft(prev => {
        const next: Record<number, string> = {};
        Object.keys(prev).forEach(sk => {
          const k = Number(sk);
          if (k < i) next[k] = prev[k];
          else if (k > i) next[k - 1] = prev[k];
        });
        return next;
      });
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
      const i = variantIndexToDelete;
      setVariants((vs) => vs.filter((_, idx) => idx !== i));
      setStockDraft(prev => {
        const next: Record<number, string> = {};
        Object.keys(prev).forEach(sk => {
          const k = Number(sk);
          if (k < i) next[k] = prev[k];
          else if (k > i) next[k - 1] = prev[k];
        });
        return next;
      });
      handleCloseVariantDeleteModal();
    } catch (err) {
      alert("Error al eliminar variante: " + (err instanceof Error ? err.message : "Error desconocido"));
    } finally {
      setIsDeletingVariant(false);
    }
  }

  async function uploadFiles(files: FileList | File[]): Promise<ProductImage[]> {
    const uploaded: ProductImage[] = [];
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Error al subir imagen");
      const data = await res.json();
      uploaded.push({ _key: tempKey(), url: data.url, order: images.length + uploaded.length, colorId: null });
    }
    return uploaded;
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;

    const targetIdx = pendingVariantImageIdxRef.current;
    pendingVariantImageIdxRef.current = null;

    setUploading(true);
    try {
      const newImages = await uploadFiles(files);
      setImages(prev => [...prev, ...newImages]);

      if (targetIdx !== null && newImages.length > 0) {
        setVariants(vs => vs.map((v, idx) => {
          if (idx !== targetIdx) return v;
          const newKeys = newImages.map(n => n._key).filter(Boolean) as string[];
          return { ...v, imageKeys: Array.from(new Set([...v.imageKeys, ...newKeys])) };
        }));
      }
    } catch (err) {
      console.error(err);
      alert("Error al subir imagen");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function getImageByKey(key: string | null): ProductImage | undefined {
    if (!key) return undefined;
    return images.find(img => (img.id === key || img._key === key));
  }

  function getAllVariantImages(v: Variant): ProductImage[] {
    const out: ProductImage[] = [];
    for (const k of v.imageKeys) {
      const img = getImageByKey(k);
      if (img) out.push(img);
    }
    return out;
  }

  function openRemoveImageFromVariant(variantIdx: number, imageKey: string) {
    const img = images.find(im => im.id === imageKey || im._key === imageKey);
    const trueKey = img ? (img.id || img._key) : imageKey;
    const usingCount = variants.reduce((s, v) => s + (v.imageKeys.some(k => k === trueKey || (img ? (k === img.id || k === img._key) : false)) ? 1 : 0), 0);
    setVariantImageToDelete({ variantIdx, imageKey: trueKey, usingCount, isShared: usingCount > 1 });
    setIsVariantImageDeleteModalOpen(true);
  }

  function confirmRemoveImageFromVariant() {
    const target = variantImageToDelete;
    if (!target) return;
    removeVariantImage(target.variantIdx, target.imageKey);
    setIsVariantImageDeleteModalOpen(false);
    setVariantImageToDelete(null);
  }

  function closeVariantImageDeleteModal() {
    setIsVariantImageDeleteModalOpen(false);
    setVariantImageToDelete(null);
  }

  function removeVariantImage(i: number, imageKey: string) {
    setVariants(vs => vs.map((v, idx) => {
      if (idx !== i) return v;
      return { ...v, imageKeys: v.imageKeys.filter(k => k !== imageKey) };
    }));
  }

  function openRemoveImageFromPool(key: string) {
    const img = images.find(im => im.id === key || im._key === key);
    if (!img) return;
    const usingCount = variants.reduce((s, v) => s + (v.imageKeys.some(k => k === img.id || k === img._key) ? 1 : 0), 0);
    if (usingCount > 0) {
      setImageKeyToDelete(key);
      setImageDeleteUsingCount(usingCount);
      setIsImageDeleteModalOpen(true);
    } else {
      confirmRemoveImageFromPool(key);
    }
  }

  function confirmRemoveImageFromPool(key: string | null) {
    if (!key) return;
    const img = images.find(im => im.id === key || im._key === key);
    if (!img) return;
    setVariants(vs => vs.map(v => ({
      ...v,
      imageKeys: v.imageKeys.filter(k => k !== img.id && k !== img._key),
    })));
    setImages(prev => {
      const next = prev.filter(im => !(im.id === key || im._key === key));
      return next.map((im, idx) => ({ ...im, order: idx }));
    });
    setIsImageDeleteModalOpen(false);
    setImageKeyToDelete(null);
    setImageDeleteUsingCount(0);
  }

  function variantLabelsForImage(key: string | null): string[] {
    if (!key) return [];
    return variants
      .map((v, idx) => {
        const matched = v.imageKeys.some(k => {
          if (k === key) return true;
          const img = getImageByKey(k);
          return !!img && (img.id === key || img._key === key);
        });
        if (!matched) return null;
        const color = v.colorId ? colors.find(c => c.id === v.colorId)?.name : null;
        const size = v.sizeId ? sizes.find(s => s.id === v.sizeId)?.label : null;
        const model = v.model;
        const parts = [color, size, model].filter(Boolean);
        return `#${idx + 1}${parts.length ? " (" + parts.join(" · ") + ")" : ""}`;
      })
      .filter((s): s is string => !!s);
  }

  function openUploadForVariant(i: number) {
    pendingVariantImageIdxRef.current = i;
    fileInputRef.current?.click();
  }

  function selectExistingImage(variantIdx: number, imageKey: string) {
    setVariants(vs => vs.map((v, idx) => {
      if (idx !== variantIdx) return v;
      if (v.imageKeys.includes(imageKey)) {
        return { ...v, imageKeys: v.imageKeys.filter(k => k !== imageKey) };
      }
      return { ...v, imageKeys: [...v.imageKeys, imageKey] };
    }));
  }

  function tryAssignFirstMatch(v: Variant): string[] {
    if (v.imageKeys.length > 0) return v.imageKeys;
    const color = v.colorId;
    if (!color) return [];
    const found = images.find(im => im.colorId === color);
    return found ? [(found.id || found._key)!].filter(Boolean) : [];
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

      const variantsSinSeccion = variants
        .map((v, idx) => ({ v, idx }))
        .filter(({ v }) => !v.sectionIds.length);

      if (variantsSinSeccion.length) {
        const lista = variantsSinSeccion
          .map(({ v, idx }) => `Variante #${idx + 1}${v.sku ? ` (${v.sku})` : ""}`)
          .join(" · ");
        const msg = `Falta asignar sección en: ${lista}`;
        toast.error(msg, {
          position: "top-right",
          description: variantsSinSeccion.length === 1
            ? "Hacé clic en '+ sección' dentro de esa fila y seleccioná al menos una (Hombre / Mujer / Niño, etc.)."
            : `Hay ${variantsSinSeccion.length} variantes sin sección. Usá el botón '+ sección' de cada una para asignarlas.`,
          closeButton: true,
          duration: 6000,
        });
        setError(msg);
        setLoading(false);
        return;
      }

      const imagesToSave = images.map((img, idx) => ({
        url: img.url,
        order: idx,
        colorId: img.colorId ?? undefined,
        ...(img.id && { id: img.id }),
        _key: img._key,
      }));

      if (isEdit && product?.id) {
        const result = await updateProduct(product.id, {
          title: form.title,
          description: form.description,
          material: form.material,
          linea: form.linea || null,
          isFeatured: form.isFeatured,
          categoryId: form.categoryId,
          brandId: form.brandId || null,
          images: imagesToSave as any
        });

        const keyToDbId: Record<string, string> = {};
        if (result && (result as any).savedImages) {
          (result as any).savedImages.forEach((entry: any) => {
            if (entry._key) keyToDbId[entry._key] = entry.id;
            if (entry.id) keyToDbId[entry.id] = entry.id;
          });
        }

        for (const v of variants) {
          const finalKeys = v.imageKeys.length > 0 ? v.imageKeys : tryAssignFirstMatch(v);
          const imageIds = finalKeys.map(k => (keyToDbId[k] || k)).filter(Boolean);
          await upsertVariant(product.id, {
            sku: v.sku,
            colorId: v.colorId || undefined,
            sizeId: v.sizeId || undefined,
            model: v.model || undefined,
            price: Number(v.price),
            oldPrice: v.oldPrice ? Number(v.oldPrice) : undefined,
            stock: Number(v.stock),
            isOutlet: v.isOutlet,
            sectionIds: v.sectionIds,
            productImageId: imageIds[0],
            imageIds,
            ...(v.id && { id: v.id }),
          });
        }
      } else {
        const createResult = await createProduct({
          ...form,
          brandId: form.brandId || undefined,
          linea: form.linea as any,
          weight: form.weight ? Number(form.weight) : undefined,
          variants: [],
          images: imagesToSave as any
        });

        const keyToDbId: Record<string, string> = {};
        if (createResult && (createResult as any).savedImages) {
          (createResult as any).savedImages.forEach((entry: any) => {
            if (entry._key) keyToDbId[entry._key] = entry.id;
            if (entry.id) keyToDbId[entry.id] = entry.id;
          });
        }

        const productId = createResult.id;
        const vars = variants.filter(v => v.sku && v.price > 0);
        for (const v of vars) {
          const finalKeys = v.imageKeys.length > 0 ? v.imageKeys : tryAssignFirstMatch(v);
          const imageIds = finalKeys.map(k => (keyToDbId[k] || k)).filter(Boolean);
          await upsertVariant(productId, {
            sku: v.sku,
            colorId: v.colorId || undefined,
            sizeId: v.sizeId || undefined,
            model: v.model || undefined,
            price: Number(v.price),
            oldPrice: v.oldPrice ? Number(v.oldPrice) : undefined,
            stock: Number(v.stock),
            isOutlet: v.isOutlet,
            sectionIds: v.sectionIds,
            productImageId: imageIds[0],
            imageIds,
            ...(v.id && { id: v.id }),
          });
        }
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
          initialView="create"
        />
      )}

      {galleryOpenForVariant !== null && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="font-heading text-lg font-bold">Usar imagen(es) existente(s)</h3>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  Haz click en cada imagen para asignarla / quitarla de la variante #{galleryOpenForVariant + 1}. Puedes seleccionar varias.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[11px] text-gray-400 font-semibold bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                  Seleccionadas: {variants[galleryOpenForVariant]?.imageKeys.length ?? 0}
                </span>
                <button
                  type="button"
                  onClick={() => setGalleryOpenForVariant(null)}
                  className="h-9 px-3 rounded-lg bg-[#11ABC4] text-white text-sm font-semibold hover:bg-[#0e98af] transition-colors shadow-sm flex items-center gap-1.5 flex-shrink-0"
                >
                  Listo
                </button>
                <button type="button" onClick={() => setGalleryOpenForVariant(null)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 flex-shrink-0">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              {images.length === 0 ? (
                <div className="py-16 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                  <GalleryHorizontalEnd size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Aún no hay imágenes en este producto.</p>
                  <p className="text-xs mt-1">Cierra y usa "Subir imagen" desde la variante para agregar una.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images.map((img, idx) => {
                    const key = img.id || img._key || String(idx);
                    const colorName = img.colorId ? colors.find(c => c.id === img.colorId)?.name : null;
                    const usingVars = variantLabelsForImage(key);
                    const variant = variants[galleryOpenForVariant];
                    const isSelected = !!variant?.imageKeys.some(k => k === img.id || k === img._key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => selectExistingImage(galleryOpenForVariant, key)}
                        className={cn(
                          "relative group border-2 rounded-2xl overflow-hidden bg-gray-50 flex flex-col text-left transition-all",
                          isSelected
                            ? "border-[#11ABC4] ring-4 ring-[#11ABC4]/10"
                            : "border-gray-100 hover:border-[#11ABC4]/50 hover:-translate-y-0.5 hover:shadow-lg"
                        )}
                      >
                        <div className="relative aspect-square w-full">
                          <Image src={img.url} alt={img.alt || `Imagen ${idx + 1}`} fill className="object-cover" />
                          {isSelected && (
                            <div className="absolute inset-0 bg-[#11ABC4]/20 flex items-center justify-center">
                              <div className="bg-[#11ABC4] text-white rounded-full p-2 shadow-lg">
                                <Save size={18} />
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="p-2.5 bg-white border-t border-gray-50 space-y-1">
                          <div className="flex flex-wrap gap-1">
                            {colorName && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                {colorName}
                              </span>
                            )}
                          </div>
                          {usingVars.length > 0 && (
                            <p className="text-[10px] text-gray-400 leading-tight">
                              Usada en: {usingVars.join(", ")}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 pb-20">
        <div className="space-y-6 pb-6">
          <div className="card p-6 space-y-4">
            <h2 className="font-heading text-lg font-bold">Información general del producto</h2>

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
                    title="Nueva marca"
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
                <label className="block text-sm font-semibold text-gray-700 mb-1">Peso (kg)</label>
                <input type="number" step="0.01" value={form.weight} onChange={update("weight")} className="input" placeholder="0.150" />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))} className="accent-[#11ABC4] w-4 h-4" />
              <span className="text-sm font-medium">Producto destacado (aparece en el home)</span>
            </label>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-heading text-lg font-bold">Variantes</h2>
                <p className="text-xs text-gray-500 mt-0.5">Cada variante puede tener varias imágenes (frontal, lateral, espalda, etc.), reutilizables entre variantes del mismo color/modelo.</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const last = variants[variants.length - 1];
                    const idx = variants.length;
                    const newVariant = {
                      ...emptyVariant(form.code, last?.sectionIds ?? defaultSectionIds),
                      colorId: last?.colorId ?? null,
                      sizeId: last?.sizeId ?? null,
                      model: last?.model ?? null,
                      price: last?.price ?? 0,
                      oldPrice: last?.oldPrice ?? null,
                      imageKeys: [...(last?.imageKeys ?? [])],
                    };
                    setVariants(vs => [...vs, newVariant]);
                    setStockDraft(prev => ({
                      ...prev,
                      [idx]: Number.isFinite(Number(last?.stock ?? 0)) ? String(Number(last?.stock ?? 0)) : "0"
                    }));
                  }}
                  className="btn-secondary text-sm px-3 py-1.5 flex items-center gap-1"
                  title="Agregar variante con valores duplicados"
                >
                  <Plus size={14} /> Duplicar último
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const idx = variants.length;
                    setVariants((v) => [...v, emptyVariant(form.code, defaultSectionIds)]);
                    setStockDraft(prev => ({ ...prev, [idx]: "0" }));
                  }}
                  className="btn-primary text-sm px-3 py-1.5 flex items-center gap-1"
                >
                  <Plus size={14} /> Agregar
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {variants.map((v, i) => {
                const variantImages = getAllVariantImages(v);
                const selectedColor = v.colorId ? colors.find(c => c.id === v.colorId) : null;
                return (
                  <div key={i} className="border border-gray-100 rounded-xl p-2.5 sm:p-3 bg-gray-50/60">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Variante #{i + 1}</h3>
                      <button type="button" onClick={() => handleOpenVariantDeleteModal(i)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* ====== LAYOUT MÓVIL: LABEL + INPUT en cada fila ====== */}
                    <div className="md:hidden space-y-3">
                      {/* SKU */}
                      <div className="flex items-center gap-2">
                        <div className="w-20 flex-shrink-0 text-[11px] font-bold text-gray-500 uppercase tracking-wider pl-1">SKU</div>
                        <div className="flex-1 min-w-0">
                          <input value={v.sku} onChange={(e) => updateVariant(i, "sku", e.target.value)} placeholder="SKU *" className="input text-[11px] h-9 px-2 w-full" title="SKU" />
                        </div>
                      </div>

                      {/* Color */}
                      <div className="flex items-center gap-2">
                        <div className="w-20 flex-shrink-0 text-[11px] font-bold text-gray-500 uppercase tracking-wider pl-1">Color</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex gap-1 h-9 w-full">
                            <div className="flex-1 relative min-w-0">
                              {selectedColor && (
                                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border border-gray-300 shadow-sm z-10 bg-cover bg-center"
                                  style={selectedColor.swatchUrl
                                    ? { backgroundImage: "url(" + selectedColor.swatchUrl + ")" }
                                    : (selectedColor.name.toLowerCase() === "transparente"
                                      ? { backgroundImage: "url('https://www.transparenttextures.com/patterns/carbon-fibre.png')", backgroundColor: "#f3f4f6" }
                                      : { backgroundColor: selectedColor.hex || "#ffffff" })}
                                  title={selectedColor.name}
                                />
                              )}
                              <select
                                value={v.colorId ?? ""}
                                onChange={(e) => updateVariant(i, "colorId", e.target.value || null)}
                                className="input text-[11px] h-9 flex-1 w-full"
                                style={{ paddingLeft: selectedColor ? "30px" : "8px" }}
                                title="Color"
                              >
                                <option value="">Sin color</option>
                                {colors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                            </div>
                            <button
                              type="button"
                              onClick={() => { setCustomColorForVariant(i); setIsCustomColorModalOpen(true); }}
                              className="btn-secondary h-9 px-2 flex items-center justify-center flex-shrink-0 border-dashed"
                              title="Crear color personalizado"
                            >
                              <Palette size={13} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Talla */}
                      <div className="flex items-center gap-2">
                        <div className="w-20 flex-shrink-0 text-[11px] font-bold text-gray-500 uppercase tracking-wider pl-1">Talla</div>
                        <div className="flex-1 min-w-0">
                          <select value={v.sizeId ?? ""} onChange={(e) => updateVariant(i, "sizeId", e.target.value || null)} className="input text-[11px] h-9 px-2 w-full" title="Talla">
                            <option value="">Sin talla</option>
                            {filteredSizes.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                          </select>
                        </div>
                      </div>

                      {/* Precio + Oferta (misma fila) */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-16 flex-shrink-0 text-[11px] font-bold text-gray-500 uppercase tracking-wider pl-1">Precio</div>
                          <div className="flex-1 min-w-0">
                            <input type="number" value={v.price || ""} onChange={(e) => updateVariant(i, "price", e.target.value ? Number(e.target.value) : 0)} className="input text-[11px] h-9 px-2 w-full" min={0} step={0.01} placeholder="Precio" title="Precio" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-16 flex-shrink-0 text-[11px] font-bold text-red-500 uppercase tracking-wider pl-1">Oferta</div>
                          <div className="flex-1 min-w-0">
                            <input type="number" value={v.oldPrice ?? ""} onChange={(e) => updateVariant(i, "oldPrice", e.target.value || null)} className="input text-[11px] h-9 px-2 text-red-600 placeholder:text-red-300 w-full" min={0} step={0.01} placeholder="Oferta" title="Oferta" />
                          </div>
                        </div>
                      </div>

                      {/* Modelo */}
                      <div className="flex items-center gap-2">
                        <div className="w-20 flex-shrink-0 text-[11px] font-bold text-gray-500 uppercase tracking-wider pl-1">Modelo</div>
                        <div className="flex-1 min-w-0">
                          <input value={v.model ?? ""} onChange={(e) => updateVariant(i, "model", e.target.value || null)} placeholder="Modelo" className="input text-[11px] h-9 px-2 w-full" title="Modelo" />
                        </div>
                      </div>

                      {/* Stock + Outlet (misma fila) */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-16 flex-shrink-0 text-[11px] font-bold text-gray-500 uppercase tracking-wider pl-1">Stock</div>
                          <div className="flex-1 min-w-0">
                            <input
                              type="text" inputMode="numeric" pattern="[0-9]*"
                              value={stockDraft[i] ?? "0"}
                              onChange={(e) => setStockDraft(prev => ({ ...prev, [i]: e.target.value.replace(/[^0-9-]/g, "") }))}
                              onBlur={() => {
                                const raw = stockDraft[i] ?? "";
                                let parsed = parseInt(raw.replace(/^0+(\d)/, "$1"), 10);
                                if (raw.length === 0 || raw === "-" || Number.isNaN(parsed)) parsed = 0;
                                if (parsed < 0) parsed = 0;
                                const normalized = String(parsed);
                                setStockDraft(prev => ({ ...prev, [i]: normalized }));
                                updateVariant(i, "stock", parsed);
                              }}
                              className="input text-[11px] h-9 px-2 tracking-wide font-semibold w-full"
                              placeholder="Stock" title="Stock" min={0}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-16 flex-shrink-0 text-[11px] font-bold text-gray-500 uppercase tracking-wider pl-1">Outlet</div>
                          <div className="flex-1 min-w-0 flex items-center h-9">
                            <input
                              type="checkbox"
                              checked={v.isOutlet}
                              onChange={(e) => updateVariant(i, "isOutlet", e.target.checked)}
                              className="accent-[#11ABC4] w-4 h-4"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Secciones (bloque igual que antes) */}
                      <div className="border-t border-gray-200/70 pt-2">
                        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider pl-1 mb-1.5">Secciones</div>
                        <div className="flex flex-col gap-1.5 min-h-[36px]">
                          <div className="flex items-center gap-1 flex-wrap">
                            {sections.filter(s => v.sectionIds.includes(s.id)).map(s => (
                              <button key={s.id} type="button" onClick={() => toggleVariantSection(i, s.id)}
                                className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#11ABC4] text-white shadow-sm leading-tight">
                                × {s.name}
                              </button>
                            ))}
                            {v.sectionIds.length === 0 && (
                              <span className="text-[10px] text-red-400 font-semibold">⚠ sin sección</span>
                            )}
                          </div>
                          <details className="group/details relative inline-block w-fit">
                            <summary className="list-none cursor-pointer px-2.5 py-1 rounded-md text-[11px] font-semibold border border-dashed border-gray-300 text-gray-500 hover:border-[#11ABC4] hover:text-[#11ABC4] leading-tight whitespace-nowrap w-fit">
                              + sección
                            </summary>
                            <div className="absolute z-[60] -top-1 left-0 translate-y-[-100%] mb-1 p-1.5 bg-white border border-gray-100 rounded-xl shadow-2xl grid grid-cols-2 gap-1 min-w-[180px] ring-1 ring-black/5">
                              {sections.map(s => {
                                const active = v.sectionIds.includes(s.id);
                                return (
                                  <button key={s.id} type="button"
                                    onClick={(e) => { (e.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open"); toggleVariantSection(i, s.id); }}
                                    className={cn(
                                      "px-2 py-1 rounded-lg text-[11px] font-semibold border text-left truncate transition-colors",
                                      active
                                        ? "bg-[#11ABC4] text-white border-[#11ABC4]"
                                        : "bg-white text-gray-600 border-gray-200 hover:border-[#11ABC4] hover:text-[#11ABC4]"
                                    )}>
                                    {s.name}
                                  </button>
                                );
                              })}
                            </div>
                          </details>
                        </div>
                      </div>

                      {/* Imágenes (bloque igual que antes) */}
                      <div className="border-t border-gray-200/70 pt-2">
                        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider pl-1 mb-1.5">Imágenes</div>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                            {variantImages.length === 0 && (
                              <div className="relative w-11 h-11 flex-shrink-0 rounded-lg overflow-hidden border border-dashed border-gray-200 bg-white/60 flex items-center justify-center text-gray-300">
                                <ImageIcon size={16} />
                              </div>
                            )}
                            {variantImages.map((img, idx) => {
                              const ik = img.id || img._key || String(idx);
                              const k = img.id || img._key;
                              return (
                                <div key={ik} className="relative w-11 h-11 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 bg-white group/vimg">
                                  <Image src={img.url} alt={v.sku || `img-${idx}`} fill className="object-cover" />
                                  <button
                                    type="button" onClick={() => k && openRemoveImageFromVariant(i, k)}
                                    className="absolute inset-0 bg-red-500/0 text-white/0 group-hover/vimg:bg-red-500/80 group-hover/vimg:text-white transition-colors flex items-center justify-center"
                                    title="Quitar imagen">
                                    <X size={12} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            <button type="button" onClick={() => openUploadForVariant(i)} disabled={uploading}
                              className="text-[11px] px-2 py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 hover:border-[#11ABC4]/40 hover:text-[#11ABC4] transition-colors flex items-center justify-center gap-1 font-medium">
                              {uploading ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />} Subir
                            </button>
                            <button type="button" onClick={() => setGalleryOpenForVariant(i)}
                              className="text-[11px] px-2 py-1.5 rounded-lg bg-[#CCECFB]/30 border border-[#CCECFB] hover:bg-[#CCECFB]/60 text-[#11ABC4] transition-colors flex items-center justify-center gap-1 font-medium truncate">
                              <GalleryHorizontalEnd size={11} className="flex-shrink-0" />
                              <span className="truncate">{variantImages.length > 0 ? "Galería (" + variantImages.length + ")" : "Galería"}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ====== LAYOUT DESKTOP (md+) grid simétrico de 10 cols ====== */}
                    <div className="hidden md:block">
                      <div className="grid grid-cols-10 gap-2 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
                        <div className="pl-1">SKU</div>
                        <div className="pl-1">Color</div>
                        <div className="pl-1">Talla</div>
                        <div className="pl-1">Precio</div>
                        <div className="pl-1 text-red-500">Oferta</div>
                        <div className="pl-1">Modelo</div>
                        <div className="pl-1">Stock</div>
                        <div className="text-center">Outlet</div>
                        <div className="pl-1">Secciones</div>
                        <div className="pl-1">Imágenes</div>
                      </div>
                      <div className="grid grid-cols-10 gap-2 items-start">
                        <div>
                          <input value={v.sku} onChange={(e) => updateVariant(i, "sku", e.target.value)} placeholder="SKU *" className="input text-[11px] h-9 px-2 w-full" title="SKU" />
                        </div>
                        <div>
                          <div className="flex gap-1 h-9 w-full">
                            <div className="flex-1 relative min-w-0">
                              {selectedColor && (
                                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border border-gray-300 shadow-sm z-10 bg-cover bg-center"
                                  style={selectedColor.swatchUrl
                                    ? { backgroundImage: "url(" + selectedColor.swatchUrl + ")" }
                                    : (selectedColor.name.toLowerCase() === "transparente"
                                      ? { backgroundImage: "url('https://www.transparenttextures.com/patterns/carbon-fibre.png')", backgroundColor: "#f3f4f6" }
                                      : { backgroundColor: selectedColor.hex || "#ffffff" })}
                                  title={selectedColor.name}
                                />
                              )}
                              <select value={v.colorId ?? ""} onChange={(e) => updateVariant(i, "colorId", e.target.value || null)}
                                className="input text-[11px] h-9 flex-1 w-full"
                                style={{ paddingLeft: selectedColor ? "30px" : "8px" }} title="Color">
                                <option value="">Sin color</option>
                                {colors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                            </div>
                            <button type="button" onClick={() => { setCustomColorForVariant(i); setIsCustomColorModalOpen(true); }}
                              className="btn-secondary h-9 px-2 flex items-center justify-center flex-shrink-0 border-dashed"
                              title="Crear color personalizado (estampado, mezcla, cebra, flores, etc.)">
                              <Palette size={13} />
                            </button>
                          </div>
                        </div>
                        <div>
                          <select value={v.sizeId ?? ""} onChange={(e) => updateVariant(i, "sizeId", e.target.value || null)}
                            className="input text-[11px] h-9 px-2 w-full" title="Talla">
                            <option value="">Sin talla</option>
                            {filteredSizes.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <input type="number" value={v.price || ""} onChange={(e) => updateVariant(i, "price", e.target.value ? Number(e.target.value) : 0)}
                            className="input text-[11px] h-9 px-2 w-full" min={0} step={0.01} placeholder="Precio" title="Precio" />
                        </div>
                        <div>
                          <input type="number" value={v.oldPrice ?? ""} onChange={(e) => updateVariant(i, "oldPrice", e.target.value || null)}
                            className="input text-[11px] h-9 px-2 text-red-600 placeholder:text-red-300 w-full"
                            min={0} step={0.01} placeholder="Oferta" title="Oferta" />
                        </div>
                        <div>
                          <input value={v.model ?? ""} onChange={(e) => updateVariant(i, "model", e.target.value || null)}
                            placeholder="Modelo" className="input text-[11px] h-9 px-2 w-full" title="Modelo" />
                        </div>
                        <div>
                          <input type="text" inputMode="numeric" pattern="[0-9]*"
                            value={stockDraft[i] ?? "0"}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/[^0-9-]/g, "");
                              setStockDraft(prev => ({ ...prev, [i]: raw }));
                            }}
                            onBlur={() => {
                              const raw = stockDraft[i] ?? "";
                              let parsed = parseInt(raw.replace(/^0+(\d)/, "$1"), 10);
                              if (raw.length === 0 || raw === "-" || Number.isNaN(parsed)) parsed = 0;
                              if (parsed < 0) parsed = 0;
                              const normalized = String(parsed);
                              setStockDraft(prev => ({ ...prev, [i]: normalized }));
                              updateVariant(i, "stock", parsed);
                            }}
                            className="input text-[11px] h-9 px-2 tracking-wide font-semibold w-full"
                            placeholder="Stock" title="Stock" min={0} />
                        </div>
                        <div className="flex items-center justify-center h-9 gap-2">
                          <input type="checkbox" checked={v.isOutlet} onChange={(e) => updateVariant(i, "isOutlet", e.target.checked)}
                            className="accent-[#11ABC4] w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex flex-col gap-1.5 min-h-[36px]">
                            <div className="flex items-center gap-1 flex-wrap">
                              {sections.filter(s => v.sectionIds.includes(s.id)).map(s => (
                                <button key={s.id} type="button" onClick={() => toggleVariantSection(i, s.id)}
                                  className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-[#11ABC4] text-white shadow-sm leading-tight"
                                  title={"Quitar " + s.name}>
                                  × {s.name}
                                </button>
                              ))}
                              {v.sectionIds.length === 0 && (
                                <span className="text-[10px] text-red-400 font-semibold">⚠ sin sección</span>
                              )}
                            </div>
                            <details className="group/details relative inline-block w-fit">
                              <summary className="list-none cursor-pointer px-2 py-1 rounded-md text-[10px] font-semibold border border-dashed border-gray-300 text-gray-500 hover:border-[#11ABC4] hover:text-[#11ABC4] leading-tight whitespace-nowrap w-fit">
                                + sección
                              </summary>
                              <div className="absolute z-[60] -top-1 left-0 translate-y-[-100%] mb-1 p-1.5 bg-white border border-gray-100 rounded-xl shadow-2xl grid grid-cols-2 gap-1 min-w-[180px] ring-1 ring-black/5">
                                {sections.map(s => {
                                  const active = v.sectionIds.includes(s.id);
                                  return (
                                    <button key={s.id} type="button"
                                      onClick={(e) => { (e.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open"); toggleVariantSection(i, s.id); }}
                                      className={cn(
                                        "px-2 py-1 rounded-lg text-[10px] font-semibold border text-left truncate transition-colors",
                                        active
                                          ? "bg-[#11ABC4] text-white border-[#11ABC4]"
                                          : "bg-white text-gray-600 border-gray-200 hover:border-[#11ABC4] hover:text-[#11ABC4]"
                                      )}>
                                      {s.name}
                                    </button>
                                  );
                                })}
                              </div>
                            </details>
                          </div>
                        </div>
                        <div>
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                              {variantImages.length === 0 && (
                                <div className="relative w-11 h-11 flex-shrink-0 rounded-lg overflow-hidden border border-dashed border-gray-200 bg-white/60 flex items-center justify-center text-gray-300">
                                  <ImageIcon size={16} />
                                </div>
                              )}
                              {variantImages.map((img, idx) => {
                                const ik = img.id || img._key || String(idx);
                                const k = img.id || img._key;
                                return (
                                  <div key={ik} className="relative w-11 h-11 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 bg-white group/vimg">
                                    <Image src={img.url} alt={v.sku || `img-${idx}`} fill className="object-cover" />
                                    <button type="button" onClick={() => k && openRemoveImageFromVariant(i, k)}
                                      className="absolute inset-0 bg-red-500/0 text-white/0 group-hover/vimg:bg-red-500/80 group-hover/vimg:text-white transition-colors flex items-center justify-center"
                                      title="Quitar imagen">
                                      <X size={12} />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                              <button type="button" onClick={() => openUploadForVariant(i)} disabled={uploading}
                                className="text-[11px] px-2 py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 hover:border-[#11ABC4]/40 hover:text-[#11ABC4] transition-colors flex items-center justify-center gap-1 font-medium">
                                {uploading ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />} Subir
                              </button>
                              <button type="button" onClick={() => setGalleryOpenForVariant(i)}
                                className="text-[11px] px-2 py-1.5 rounded-lg bg-[#CCECFB]/30 border border-[#CCECFB] hover:bg-[#CCECFB]/60 text-[#11ABC4] transition-colors flex items-center justify-center gap-1 font-medium truncate"
                                title="Usar imagen existente (puedes seleccionar varias)">
                                <GalleryHorizontalEnd size={11} className="flex-shrink-0" />
                                <span className="truncate">{variantImages.length > 0 ? "Galería (" + variantImages.length + ")" : "Galería"}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-heading text-lg font-bold">Banco de imágenes del producto</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Las imágenes aquí cargadas se pueden reutilizar en varias variantes. Una imagen solo se borra si no está asignada a ninguna variante.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { pendingVariantImageIdxRef.current = null; fileInputRef.current?.click(); }}
                disabled={uploading}
                className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                Subir foto
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

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {images.map((img, i) => {
                const key = img.id || img._key || String(i);
                const colorName = img.colorId ? colors.find(c => c.id === img.colorId)?.name : null;
                const usingVars = variantLabelsForImage(key);
                return (
                  <div key={key} className="relative group border border-gray-100 rounded-xl overflow-hidden bg-gray-50 flex flex-col">
                    <div className="relative aspect-square w-full">
                      <Image src={img.url} alt={`Imagen ${i + 1}`} fill className="object-cover" quality={100} />
                      <button
                        type="button"
                        onClick={() => openRemoveImageFromPool(key)}
                        className="absolute top-1.5 right-1.5 p-1.5 bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        title={usingVars.length ? "Quitar de todas las variantes y eliminar" : "Eliminar imagen"}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <div className="p-2 bg-white border-t border-gray-50 space-y-1">
                      <div className="flex flex-wrap gap-1">
                        <select
                          value={img.colorId ?? ""}
                          onChange={(e) => setImages(prev => prev.map((im, idx) => idx === i ? { ...im, colorId: e.target.value || null } : im))}
                          className="w-full text-[10px] py-1 border-none bg-gray-50 rounded font-medium focus:ring-0"
                        >
                          <option value="">Sin color</option>
                          {colors.map(c => (
                            <option key={c.id} value={c.id}>Color: {c.name}</option>
                          ))}
                        </select>
                        {!colorName && <span className="w-full" />}
                      </div>
                      {usingVars.length > 0 && (
                        <p className="text-[9px] text-gray-400 leading-tight truncate" title={usingVars.join(", ")}>
                          Usada en {usingVars.length} variante(s)
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              {images.length === 0 && (
                <div className="col-span-full py-10 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center text-gray-400">
                  <ImageIcon size={28} className="mb-2 opacity-20" />
                  <p className="text-xs">No hay imágenes. Sube fotos desde aquí o desde cada variante.</p>
                </div>
              )}
            </div>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

          <div className="flex flex-row flex-nowrap items-stretch justify-stretch w-full gap-2 sm:gap-3 sm:justify-end mt-4">
            <button
              type="button"
              onClick={() => router.push("/admin/products")}
              className="flex-1 min-w-0 sm:flex-none sm:w-auto sm:min-w-[130px] md:px-8 flex items-center justify-center gap-1.5 py-3 font-semibold text-white rounded-xl shadow-sm active:scale-95 transition-all duration-200"
              style={{
                backgroundColor: "#EF4444",
                borderRadius: "0.75rem",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#DC2626"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#EF4444"; }}
            >
              <span className="whitespace-nowrap">Cancelar</span>
            </button>
            <button type="submit" disabled={loading || uploading} className="btn-primary flex-1 min-w-0 sm:flex-none sm:w-auto sm:min-w-[170px] md:px-10 flex items-center justify-center gap-2 py-3 overflow-hidden">
              {loading ? <Loader2 size={18} className="animate-spin flex-shrink-0" /> : <Save size={18} className="flex-shrink-0" />}
              <span className="truncate text-sm whitespace-nowrap">
                {loading ? "Guardando..." : isEdit ? "Actualizar producto" : "Crear producto"}
              </span>
            </button>
          </div>
        </div>
      </form>

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

      {isImageDeleteModalOpen && imageKeyToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">¿Eliminar imagen?</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Esta imagen está actualmente asignada a <span className="font-bold text-red-600">{imageDeleteUsingCount} variante(s)</span>.
                <br />
                Si continúas, se quitará de todas las variantes y se <span className="font-bold text-gray-900">eliminará definitivamente</span>. Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsImageDeleteModalOpen(false);
                  setImageKeyToDelete(null);
                  setImageDeleteUsingCount(0);
                }}
                className="btn-secondary flex-1 h-11 text-sm font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => confirmRemoveImageFromPool(imageKeyToDelete)}
                className="btn-primary bg-red-600 hover:bg-red-700 border-red-600 flex-1 h-11 text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {isVariantImageDeleteModalOpen && variantImageToDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {variantImageToDelete.isShared ? "¿Quitar imagen de esta variante?" : "¿Quitar esta imagen?"}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {variantImageToDelete.isShared ? (
                  <>
                    Esta imagen se <span className="font-bold">usa también en otras variantes</span>{" "}
                    (<span className="font-bold text-red-600">{variantImageToDelete.usingCount} en total</span>).
                    <br />
                    Si continúas, solo se <span className="font-bold text-gray-900">quitará de la variante actual</span>. La imagen seguirá disponible en el banco de imágenes y en las demás variantes que la usen.
                  </>
                ) : (
                  <>
                    Esta imagen está asignada a <span className="font-bold text-red-600">{variantImageToDelete.usingCount} variante(s)</span>.
                    <br />
                    Si continúas, se <span className="font-bold text-gray-900">quitará de esta variante</span>. La seguirás encontrando en el banco de imágenes del producto por si la vuelves a necesitar.
                  </>
                )}
              </p>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex gap-3">
              <button
                type="button"
                onClick={closeVariantImageDeleteModal}
                className="btn-secondary flex-1 h-11 text-sm font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmRemoveImageFromVariant}
                className="btn-primary bg-red-600 hover:bg-red-700 border-red-600 flex-1 h-11 text-sm font-semibold flex items-center justify-center gap-2"
              >
                <X size={16} />
                Quitar
              </button>
            </div>
          </div>
        </div>
      )}

      <CustomColorModal
        isOpen={isCustomColorModalOpen}
        onClose={() => {
          setIsCustomColorModalOpen(false);
          setCustomColorForVariant(null);
        }}
        onCreated={handleCustomColorCreated}
        productImages={images}
        defaultNamePrefix={form.code}
      />
    </>
  );
}
