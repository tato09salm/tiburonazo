"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, ChevronRight, Minus, Plus, Package, Ruler, Tag } from "lucide-react";
import { PriceDisplay } from "@/components/store/price-display";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/utils";
import type { ProductDetail } from "@/types";

interface Props {
  product: ProductDetail;
}

export function ProductDetailClient({ product }: Props) {
  const { addItem, count } = useCart();
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0] ?? null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);

  // Group variants by color
  const colors = [...new Set(product.variants.map((v) => v.color?.name).filter(Boolean))];
  const sizes = [...new Set(product.variants.filter((v) => !selectedVariant?.color?.name || v.color?.name === selectedVariant?.color?.name).map((v) => v.size?.label).filter(Boolean))];

  // Filter images by selected color
  const filteredImages = product.images.filter(img => 
    !img.colorId || img.colorId === selectedVariant?.colorId
  ).sort((a, b) => a.order - b.order);

  // If activeImage index is out of bounds for filtered images, reset it
  if (activeImage >= filteredImages.length && filteredImages.length > 0) {
    setActiveImage(0);
  }

  function selectColor(colorName: string) {
    const variant = product.variants.find((v) => v.color?.name === colorName);
    if (variant) { 
      setSelectedVariant(variant); 
      setQuantity(1); 
      setActiveImage(0); // Reset image to first one of new color
    }
  }

  function selectSize(sizeLabel: string) {
    const variant = product.variants.find(
      (v) => v.size?.label === sizeLabel && (!selectedVariant?.color?.name || v.color?.name === selectedVariant?.color?.name)
    );
    if (variant) { setSelectedVariant(variant); setQuantity(1); }
  }

  function handleAddToCart() {
    if (!selectedVariant) return;
    addItem({
      variantId: selectedVariant.id,
      productId: product.id,
      title: product.title,
      slug: product.slug,
      image: product.images[0]?.url ?? "/placeholder.png",
      color: selectedVariant.color?.name ?? null,
      size: selectedVariant.size?.label ?? null,
      model: selectedVariant.model,
      price: selectedVariant.price,
      quantity,
      stock: selectedVariant.stock,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const inStock = (selectedVariant?.stock ?? 0) > 0;

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-[#11ABC4]">Inicio</Link>
        <ChevronRight size={14} />
        <Link href="/productos" className="hover:text-[#11ABC4]">Productos</Link>
        <ChevronRight size={14} />
        <Link href={`/categoria/${product.category.slug}`} className="hover:text-[#11ABC4]">{product.category.name}</Link>
        <ChevronRight size={14} />
        <span className="text-gray-600 truncate max-w-xs">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Images */}
        <div className="space-y-3">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50">
            {filteredImages[activeImage] ? (
              <Image
                src={filteredImages[activeImage].url}
                alt={filteredImages[activeImage].alt ?? product.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">🏊</div>
            )}
            {selectedVariant?.oldPrice && selectedVariant.oldPrice > selectedVariant.price && (
              <div className="absolute top-3 left-3">
                <span className="badge bg-red-500 text-white text-sm px-3 py-1">
                  -{Math.round(((selectedVariant.oldPrice - selectedVariant.price) / selectedVariant.oldPrice) * 100)}% OFF
                </span>
              </div>
            )}
          </div>
          {filteredImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {filteredImages.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    "relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all",
                    activeImage === i ? "border-[#11ABC4]" : "border-transparent hover:border-gray-200"
                  )}
                >
                  <Image src={img.url} alt={img.alt ?? ""} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href={`/categoria/${product.category.slug}`} className="badge bg-[#CCECFB] text-[#11ABC4]">
                {product.category.name}
              </Link>
              {product.brand && <span className="badge bg-gray-100 text-gray-600">{product.brand.name}</span>}
              <span className="badge bg-gray-100 text-gray-500 text-xs">{product.code}</span>
            </div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-gray-900">{product.title}</h1>
          </div>

          {selectedVariant && (
            <PriceDisplay price={selectedVariant.price} oldPrice={selectedVariant.oldPrice} size="lg" />
          )}

          {/* Colors */}
          {colors.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Color: <span className="font-normal text-gray-500">{selectedVariant?.color?.name}</span>
              </p>
              <div className="flex gap-2 flex-wrap">
                {colors.map((colorName) => (
                  <button
                    key={colorName!}
                    onClick={() => selectColor(colorName!)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all",
                      selectedVariant?.color?.name === colorName
                        ? "border-[#11ABC4] bg-[#CCECFB] text-[#11ABC4]"
                        : "border-gray-200 hover:border-[#11ABC4] text-gray-600"
                    )}
                  >
                    {colorName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sizes */}
          {sizes.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <Ruler size={14} /> Talla: <span className="font-normal text-gray-500">{selectedVariant?.size?.label}</span>
              </p>
              <div className="flex gap-2 flex-wrap">
                {sizes.map((sizeLabel) => {
                  const v = product.variants.find((v) => v.size?.label === sizeLabel && (!selectedVariant?.color?.name || v.color?.name === selectedVariant?.color?.name));
                  const available = (v?.stock ?? 0) > 0;
                  return (
                    <button
                      key={sizeLabel!}
                      onClick={() => selectSize(sizeLabel!)}
                      disabled={!available}
                      className={cn(
                        "min-w-[44px] px-3 py-2 rounded-lg border-2 text-sm font-semibold transition-all",
                        selectedVariant?.size?.label === sizeLabel
                          ? "border-[#11ABC4] bg-[#11ABC4] text-white"
                          : available
                          ? "border-gray-200 hover:border-[#11ABC4] text-gray-700"
                          : "border-gray-100 text-gray-300 cursor-not-allowed line-through"
                      )}
                    >
                      {sizeLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stock */}
          <div className="flex items-center gap-2 text-sm">
            <Package size={14} className={inStock ? "text-green-500" : "text-gray-400"} />
            {inStock ? (
              <span className="text-green-600 font-medium">
                {(selectedVariant?.stock ?? 0) <= 5 ? `¡Últimas ${selectedVariant?.stock} unidades!` : "En stock"}
              </span>
            ) : (
              <span className="text-gray-400">Agotado</span>
            )}
          </div>

          {/* Quantity + Add to cart */}
          <div className="flex gap-3 items-center">
            <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2.5 hover:bg-gray-50 text-gray-600 transition-colors"
              >
                <Minus size={16} />
              </button>
              <span className="px-4 py-2 text-sm font-bold min-w-[40px] text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(selectedVariant?.stock ?? 1, quantity + 1))}
                className="px-3 py-2.5 hover:bg-gray-50 text-gray-600 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={!inStock || !selectedVariant}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold transition-all duration-200",
                added
                  ? "bg-green-500 text-white"
                  : inStock
                  ? "bg-[#11ABC4] hover:bg-[#0d8fa6] text-white active:scale-95"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              )}
            >
              <ShoppingCart size={18} />
              {added ? "¡Agregado! ✓" : inStock ? "Agregar al carrito" : "Sin stock"}
            </button>
          </div>

          {/* Details */}
          <div className="border-t border-gray-100 pt-4 space-y-2 text-sm text-gray-600">
            {product.description && <p className="leading-relaxed">{product.description}</p>}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3">
              {product.material && <div><span className="font-semibold">Material:</span> {product.material}</div>}
              {product.linea && <div><span className="font-semibold">Línea:</span> {product.linea}</div>}
              {product.gender && <div><span className="font-semibold">Público:</span> {product.gender}</div>}
              {product.weight && <div><span className="font-semibold">Peso:</span> {product.weight}g</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
