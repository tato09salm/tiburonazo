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

  const mainImage = product.images[0]?.url ?? "/placeholder4.png";
  const hoverImage = product.images[1]?.url;
  const defaultVariant = product.variants[0];
  const hasDiscount = defaultVariant?.oldPrice && defaultVariant.oldPrice > defaultVariant.price;
  const inStock = product.variants.some((v) => v.stock > 0);

  const colors = Array.from(new Set(product.variants.map(v => v.color?.hex).filter(Boolean)));
  const firstColorName = defaultVariant?.color?.name || "Único";
  const firstSizeLabel = defaultVariant?.size?.label || "Único";

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation(); // Evita que el clic active el enlace de la tarjeta
    if (!defaultVariant || !inStock) return;
    
    addItem({
      variantId: defaultVariant.id,
      productId: product.id,
      title: product.title,
      slug: product.slug,
      image: mainImage,
      color: firstColorName as string,
      size: firstSizeLabel as string,
      model: defaultVariant.model,
      price: defaultVariant.price,
      quantity: 1,
      stock: defaultVariant.stock,
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
              added ? "bg-green-500" : "bg-[#11ABC4] hover:bg-[#0d8fa6]",
              !inStock && "opacity-50 cursor-not-allowed"
            )}
            title="Agregar al carrito"
          >
            <ShoppingCart size={16} />
          </button>
          <div
            className="p-2 rounded-xl bg-white shadow-md text-[#11ABC4] hover:bg-[#CCECFB] transition-all duration-200"
            title="Ver producto"
          >
            <Eye size={16} />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1 gap-1 z-10 pointer-events-none">
        <p className="text-xs text-[#11ABC4] font-semibold uppercase tracking-wide">
          {product.category.name}
        </p>
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-gray-800">
          {product.title}
        </h3>
        
        {/* ... resto de tu código igual ... */}
        {product.brand && (
          <p className="text-xs text-gray-500">{product.brand.name}</p>
        )}

        {colors.length > 0 && (
          <div className="flex gap-1 mt-1">
            {colors.slice(0, 4).map((hex, i) => (
              <div 
                key={i} 
                className="w-2.5 h-2.5 rounded-full border border-gray-200" 
                style={{ backgroundColor: hex as string }}
              />
            ))}
            {colors.length > 4 && (
              <span className="text-[10px] text-gray-400">+{colors.length - 4}</span>
            )}
          </div>
        )}

        <div className="mt-auto pt-2">
          {defaultVariant ? (
            <PriceDisplay price={defaultVariant.price} oldPrice={defaultVariant.oldPrice} size="sm" />
          ) : (
            <span className="text-sm text-gray-400">Sin precio</span>
          )}
        </div>
      </div>
    </div>
  );
}