// hooks/useProductDetail.ts
import { useState, useMemo } from "react";
import type { ProductDetail, ProductVariant } from "@/types";

export function useProductDetail(product: ProductDetail) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(product.variants[0] ?? null);
  const [quantity, setQuantity] = useState(1);
  const [showAllImages, setShowAllImages] = useState(false);
  const [openSection, setOpenSection] = useState<"description" | "specs" | null>(null);

  const colors = useMemo(() => {
    return Array.from(
      new Map(
        product.variants
          .map((v) => v.color)
          .filter((c) => c !== null)
          .map((c) => [c.id, c])
      ).values()
    );
  }, [product.variants]);

  const sizes = useMemo(() => {
    return [...new Set(
      product.variants
        .filter((v) => !selectedVariant?.color?.name || v.color?.name === selectedVariant?.color?.name)
        .map((v) => v.size?.label)
        .filter(Boolean)
    )];
  }, [product.variants, selectedVariant?.color?.name]);

  const filteredImages = useMemo(() => {
    return product.images
      .filter(img => !img.colorId || img.colorId === selectedVariant?.colorId)
      .sort((a, b) => a.order - b.order);
  }, [product.images, selectedVariant?.colorId]);

  const selectColor = (colorName: string) => {
    const variant = product.variants.find((v) => v.color?.name === colorName);
    if (variant) {
      setSelectedVariant(variant);
      setQuantity(1);
      setShowAllImages(false);
    }
  };

  const isLightColor = (hex: string | null) => {
    if (!hex) return false;
    const color = hex.replace('#', '');
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    return (r * 0.299 + g * 0.587 + b * 0.114) > 200;
  };

  return {
    selectedVariant,
    setSelectedVariant,
    quantity,
    setQuantity,
    showAllImages,
    setShowAllImages,
    openSection,
    setOpenSection,
    colors,
    sizes,
    filteredImages,
    selectColor,
    isLightColor,
    stock: selectedVariant?.stock ?? 0
  };
}