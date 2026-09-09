"use client";

import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/types";
import { PriceDisplay } from "./price-display";
import { useCart } from "@/hooks/useCart";
import { useState } from "react";
import { ShoppingCart, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  product: ProductCard;
}

export function ProductCardComponent({ product }: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const defaultVariant = product.variants.find(v => v.stock > 0) || product.variants[0];
  const [activeVariant, setActiveVariant] = useState(defaultVariant);

  const currentVariant = activeVariant || defaultVariant;

  // Helper para obtener las URLs de las imágenes de una variante
  function getVariantImageUrls(variant?: ProductVariant): string[] {
    if (!variant) return [];
    const fromImages = (variant as any).images?.map((link: any) => link.productImage?.url).filter(Boolean) || [];
    if (fromImages.length > 0) return fromImages;
    if ((variant as any).productImage?.url) return [(variant as any).productImage.url];
    return [];
  }

  const variantImages = getVariantImageUrls(currentVariant);
  const mainImage = variantImages[0] ?? product.images[0]?.url ?? "/placeholder4.png";
  const hoverImage = variantImages[1] ?? (variantImages.length === 0 ? product.images[1]?.url : undefined);

  const hasDiscount = currentVariant?.oldPrice && currentVariant.oldPrice > currentVariant.price;
  const inStock = product.variants.some((v) => v.stock > 0);

  const colorSwatches = Array.from(
    new Map(
      product.variants
        .map(v => v.color)
        .filter((c): c is NonNullable<typeof product.variants[number]["color"]> => c !== null)
        .map(c => [c.id, { id: c.id, name: c.name, hex: c.hex, swatchUrl: c.swatchUrl }])
    ).values()
  );
  const currentColorName = currentVariant?.color?.name || "Único";
  const currentSizeLabel = currentVariant?.size?.label || "Único";

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation(); // Evita que el clic active el enlace de la tarjeta
    if (!currentVariant || !inStock) return;
    
    addItem({
      variantId: currentVariant.id,
      productId: product.id,
      title: product.title,
      slug: product.slug,
      image: mainImage,
      color: currentColorName as string,
      size: currentSizeLabel as string,
      estampado: (currentVariant as any).estampado ?? currentVariant.diseno ?? null,
      diseno: (currentVariant as any).estampado ?? currentVariant.diseno ?? null,
      price: currentVariant.price,
      quantity: 1,
      stock: currentVariant.stock,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="group card flex flex-col hover:shadow-md transition-shadow duration-300 relative overflow-hidden">
      {/* Link que cubre toda la tarjeta */}
      <Link 
        href={`/productos/${product.slug}`} 
        className="absolute inset-0 z-0"
        aria-label={product.title}
      />

      {/* Image */}
      <div className="relative overflow-hidden bg-gray-50 aspect-[3/4] z-10 pointer-events-none">
        <Image
          src={mainImage}
          alt={product.title}
          fill
          className={cn(
            "object-cover transition-all duration-500",
            hoverImage ? "group-hover:opacity-0" : "group-hover:scale-105"
          )}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          quality={75}
        />
        {hoverImage && (
          <Image
            src={hoverImage}
            alt={product.title}
            fill
            className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            quality={75}
          />
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-20">
          {hasDiscount && (
            <span className="badge bg-red-500 text-white">
              -{Math.round(((defaultVariant.oldPrice! - defaultVariant.price) / defaultVariant.oldPrice!) * 100)}%
            </span>
          )}
          {!inStock && (
            <span className="badge bg-gray-500 text-white">Agotado</span>
          )}
        </div>

        {/* Quick action */}
        <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAddToCart(e);
            }}
            disabled={!inStock}
            className={cn(
              "p-2 rounded-xl shadow-md transition-all duration-200 text-white",
              added ? "bg-green-500" : "bg-primary hover:bg-primary-dark",
              !inStock && "opacity-50 cursor-not-allowed"
            )}
            title="Agregar al carrito"
          >
            <ShoppingCart size={16} />
          </button>
          <div
            className="p-2 rounded-xl bg-white shadow-md text-primary hover:bg-light transition-all duration-200"
            title="Ver producto"
          >
            <Eye size={16} />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1 gap-1 z-10 pointer-events-none">
        <p className="text-xs text-primary font-semibold uppercase tracking-wide">
          {product.category.name}
        </p>
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-gray-800">
          {product.title}
        </h3>
        
        {/* ... resto de tu código igual ... */}
        {product.brand && (
          <p className="text-xs text-gray-500">{product.brand.name}</p>
        )}

        {colorSwatches.length > 0 && (
          <div className="flex gap-1.5 mt-1.5 z-20 pointer-events-auto items-center">
            {colorSwatches.slice(0, 5).map((c, i) => {
              const isCurrent = currentVariant?.color?.id === c.id;
              return (
                <button
                  key={c.id || i}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const match = product.variants.find(v => v.color?.id === c.id);
                    if (match) setActiveVariant(match);
                  }}
                  onMouseEnter={() => {
                    const match = product.variants.find(v => v.color?.id === c.id);
                    if (match) setActiveVariant(match);
                  }}
                  className={cn(
                    "rounded-full transition-all p-0.5",
                    isCurrent ? "ring-2 ring-primary ring-offset-1 scale-110" : "hover:scale-110 opacity-80 hover:opacity-100"
                  )}
                  title={c.name}
                >
                  {c.swatchUrl ? (
                    <div
                      className="w-3 h-3 rounded-full border border-gray-200 bg-cover bg-center shadow-xs"
                      style={{ backgroundImage: `url(${c.swatchUrl})` }}
                    />
                  ) : (
                    <div
                      className="w-3 h-3 rounded-full border border-gray-200 shadow-xs"
                      style={{ backgroundColor: (c.hex ?? "#EEE") as string }}
                    />
                  )}
                </button>
              );
            })}
            {colorSwatches.length > 5 && (
              <span className="text-[10px] text-gray-400 font-medium">+{colorSwatches.length - 5}</span>
            )}
          </div>
        )}

        <div className="mt-auto pt-2">
          {currentVariant ? (
            <PriceDisplay price={currentVariant.price} oldPrice={currentVariant.oldPrice} size="sm" />
          ) : (
            <span className="text-sm text-gray-400">Sin precio</span>
          )}
        </div>
      </div>
    </div>
  );
}