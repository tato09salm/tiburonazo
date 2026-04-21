"use client";
import { useState } from "react";
import Image from "next/image";
import { ShoppingCart, Minus, Plus, AlertCircle } from "lucide-react";
import { PriceDisplay } from "@/components/store/price-display";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import type { ProductDetail, ProductVariant } from "@/types";

interface InfoProps {
  product: ProductDetail;
  selectedVariant: ProductVariant | null;
  onVariantChange: (variant: ProductVariant) => void;
  resetGallery: () => void;
  hideHeader?: boolean; // Nueva Prop
}

export function ProductInfo({ product, selectedVariant, onVariantChange, resetGallery, hideHeader }: InfoProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const stock = selectedVariant?.stock ?? 0;

  const uniqueColors = Array.from(
    new Map(
      product.variants
        .map((v) => v.color)
        .filter((c) => c !== null)
        .map((c) => [c.id, c])
    ).values()
  );

  const sizes = [...new Set(product.variants
    .filter((v) => !selectedVariant?.color?.name || v.color?.name === selectedVariant?.color?.name)
    .map((v) => v.size?.label).filter(Boolean))];

  const isLightColor = (hex: string | null) => {
    if (!hex) return false;
    const color = hex.replace('#', '');
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    return (r * 0.299 + g * 0.587 + b * 0.114) > 200;
  };

  return (
    <div className="space-y-8">
      {/* Ocultar en móvil si hideHeader es true */}
      {!hideHeader && (
        <div className="space-y-4">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-none tracking-tight uppercase">
            {product.title}
          </h1>
          {selectedVariant && <PriceDisplay price={selectedVariant.price} oldPrice={selectedVariant.oldPrice} size="lg" />}
        </div>
      )}

      <div className="space-y-4">
        <p className="text-xs font-black text-gray-900 uppercase tracking-widest">Color</p>
        <div className="space-y-3">
          <div className="flex gap-3 flex-wrap">
            {uniqueColors.map((color) => {
              const isSelected = selectedVariant?.colorId === color.id;
              const light = isLightColor(color.hex);
              return (
                <button
                  key={color.id}
                  onClick={() => {
                    const variant = product.variants.find(v => v.colorId === color.id);
                    if (variant) {
                      onVariantChange(variant);
                      setQuantity(1);
                      resetGallery();
                    }
                  }}
                  className={cn(
                    "relative w-11 h-11 rounded-full border-2 transition-all flex items-center justify-center",
                    isSelected ? "border-[#11ABC4] scale-110 shadow-md" : "border-transparent hover:border-gray-200"
                  )}
                >
                  <div className={cn("w-9 h-9 rounded-full flex items-center justify-center", light && "border border-gray-100")} style={{ backgroundColor: color.hex || "#EEE" }}>
                    <Image
                      src="/logo2.png"
                      alt="logo"
                      width={90}
                      height={44}
                      className={cn("w-[90%] h-auto object-contain transition-all duration-300",
                        isSelected ? "opacity-100 scale-100" : "opacity-30 scale-75",
                        light ? "brightness-0" : "brightness-0 invert")}
                    />
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{selectedVariant?.color?.name}</p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-black text-gray-900 uppercase tracking-widest">Talla</p>
        <div className="flex gap-2 flex-wrap">
          {sizes.map((label) => {
            const v = product.variants.find(v => v.size?.label === label && v.colorId === selectedVariant?.colorId);
            const active = selectedVariant?.size?.label === label;
            return (
              <button
                key={label}
                disabled={!v || v.stock === 0}
                onClick={() => v && onVariantChange(v)}
                className={cn(
                  "min-w-[54px] h-12 px-4 rounded-lg border-2 text-xs font-bold transition-all uppercase",
                  active ? "border-[#11ABC4] bg-[#11ABC4] text-white shadow-lg shadow-[#11ABC4]/20" : "border-gray-100 text-gray-700 hover:border-gray-900 disabled:opacity-30"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
        {stock > 0 && stock <= 5 && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] font-black uppercase tracking-tight text-[#11ABC4] flex items-center gap-1">
              {stock === 1 ? "Solo queda 1 en nuestros almacenes" : "Últimas unidades"}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-4 pt-4 border-t border-gray-50">
        <div className="flex gap-3">
          <div className="flex items-center bg-gray-50 rounded-lg border border-gray-100">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-full flex items-center justify-center text-gray-400 hover:text-black transition-colors"><Minus size={14} /></button>
            <span className="w-8 text-center font-bold text-sm">{quantity}</span>
            <button onClick={() => setQuantity(Math.min(stock, quantity + 1))} className="w-10 h-full flex items-center justify-center text-gray-400 hover:text-black transition-colors"><Plus size={14} /></button>
          </div>
          <button
            onClick={() => {
              if (!selectedVariant) return;
              addItem({
                variantId: selectedVariant.id,
                productId: product.id,
                title: product.title,
                slug: product.slug,
                image: product.images.find(img => img.colorId === selectedVariant.colorId)?.url || product.images[0].url,
                color: selectedVariant.color?.name || null,
                size: selectedVariant.size?.label || null,
                model: selectedVariant.model,
                price: selectedVariant.price,
                quantity,
                stock,
              });
              setAdded(true);
              setTimeout(() => setAdded(false), 2000);
            }}
            disabled={stock === 0}
            className={cn(
              "flex-1 h-14 flex items-center justify-center gap-3 rounded-lg font-black text-xs uppercase tracking-[0.1em] transition-all",
              added ? "bg-green-600 text-white" : "bg-[#11ABC4] hover:bg-[#0d8fa6] text-white shadow-xl shadow-[#11ABC4]/20 active:scale-95 disabled:bg-gray-200"
            )}
          >
            <ShoppingCart size={18} />
            {added ? "¡AGREGADO!" : stock > 0 ? "Añadir al carrito" : "Sin Stock"}
          </button>
        </div>
      </div>
    </div>
  );
}