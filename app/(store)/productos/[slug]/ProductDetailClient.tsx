"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductInfo } from "@/components/product/ProductInfo";
import { ProductCardComponent } from "@/components/store/product-card";
import { PriceDisplay } from "@/components/store/price-display";
import type { ProductDetail, ProductVariant, ProductCard } from "@/types";

interface Props {
  product: ProductDetail;
  relatedProducts: ProductCard[];
}

export function ProductDetailClient({ product, relatedProducts }: Props) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(product.variants[0] ?? null);
  const [showAllImages, setShowAllImages] = useState(false);
  const [openSection, setOpenSection] = useState<"description" | "specs" | null>(null);

  const filteredImages = useMemo(() => {
    return product.images
      .filter(img => !img.colorId || img.colorId === selectedVariant?.colorId)
      .sort((a, b) => a.order - b.order);
  }, [product.images, selectedVariant?.colorId]);

  const discountBadge = selectedVariant?.oldPrice && selectedVariant.oldPrice > selectedVariant.price
    ? Math.round(((selectedVariant.oldPrice - selectedVariant.price) / selectedVariant.oldPrice) * 100)
    : null;

  return (
    <div className="w-full pb-20">
      {/* Breadcrumbs - Siempre arriba */}
      <nav className="flex items-center gap-2 text-xs text-gray-400 py-4 uppercase font-bold tracking-widest overflow-x-auto whitespace-nowrap">
        <Link href="/" className="hover:text-[#11ABC4] shrink-0">Inicio</Link>
        <ChevronRight size={12} />
        <Link href="/productos" className="hover:text-[#11ABC4] shrink-0">Productos</Link>
        <ChevronRight size={12} />
        <span className="text-gray-600 truncate">{product.title}</span>
      </nav>

      {/* Título y Precio: Solo visible en Móvil antes de la galería */}
      <div className="md:hidden mb-6 space-y-2">
        <h1 className="text-2xl font-black text-gray-900 uppercase leading-tight">
          {product.title}
        </h1>
        {selectedVariant && (
          <PriceDisplay 
            price={selectedVariant.price} 
            oldPrice={selectedVariant.oldPrice} 
            size="lg" 
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-12 items-start">
        
        {/* COLUMNA IZQUIERDA: Galería + Acordeones + Relacionados */}
        <div className="md:col-span-8 space-y-4">
          
          <ProductGallery 
            images={filteredImages} 
            productTitle={product.title} 
            discountBadge={discountBadge}
            showAll={showAllImages}
            onToggleShowAll={() => setShowAllImages(!showAllImages)}
          />

          {/* Info de Compra (Variantes y Botón) en móvil aparece AQUÍ */}
          <div className="md:hidden pt-4">
            <ProductInfo 
              product={product} 
              selectedVariant={selectedVariant} 
              onVariantChange={setSelectedVariant}
              resetGallery={() => setShowAllImages(false)}
              hideHeader // Nueva prop para no repetir título/precio en móvil
            />
          </div>

          {/* Acordeones */}
          <div className="space-y-2 pt-8">
            <div className="border-b border-gray-100">
              <button 
                onClick={() => setOpenSection(openSection === "description" ? null : "description")} 
                className="w-full py-5 flex items-center justify-between group"
              >
                <span className="text-sm font-black uppercase tracking-widest text-gray-900 group-hover:text-[#11ABC4] transition-colors">Descripción</span>
                {openSection === "description" ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              <div className={cn("overflow-hidden transition-all duration-300", openSection === "description" ? "max-h-96 pb-6" : "max-h-0")}>
                <p className="text-sm text-gray-500 leading-relaxed italic border-l-2 border-[#CCECFB] pl-4">
                  {product.description || "No hay descripción disponible."}
                </p>
              </div>
            </div>

            <div className="border-b border-gray-100">
              <button 
                onClick={() => setOpenSection(openSection === "specs" ? null : "specs")} 
                className="w-full py-5 flex items-center justify-between group"
              >
                <span className="text-sm font-black uppercase tracking-widest text-gray-900 group-hover:text-[#11ABC4] transition-colors">Características</span>
                {openSection === "specs" ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              <div className={cn("overflow-hidden transition-all duration-300", openSection === "specs" ? "max-h-96 pb-6" : "max-h-0")}>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                  {product.brand && <SpecItem label="Marca" value={product.brand.name} />}
                  <SpecItem label="Material" value={product.material || "Premium"} />
                  <SpecItem label="Género" value={product.gender} />
                </div>
              </div>
            </div>
          </div>

          {/* Relacionados */}
          {relatedProducts.length > 0 && (
            <section className="mt-5 pt-10 border-t border-gray-100">
              <h2 className="text-m font-black uppercase tracking-[0.2em] mb-10 text-gray-900">
                También te puede gustar
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10">
                {relatedProducts.map((p) => (
                  <ProductCardComponent key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* COLUMNA DERECHA: Solo visible en Desktop */}
        <aside className="hidden md:block md:col-span-4 sticky top-39 self-start">
          <ProductInfo 
            product={product} 
            selectedVariant={selectedVariant} 
            onVariantChange={setSelectedVariant}
            resetGallery={() => setShowAllImages(false)}
          />
        </aside>
      </div>
    </div>
  );
}

function SpecItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{label}</p>
      <p className="text-xs font-bold text-gray-800">{value}</p>
    </div>
  );
}