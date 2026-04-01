import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(price);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function generateSKU(productCode: string, variant: { color?: string; size?: string; model?: string }): string {
  const parts = [productCode];
  if (variant.color) parts.push(variant.color.substring(0, 3).toUpperCase());
  if (variant.size) parts.push(String(variant.size));
  if (variant.model) parts.push(variant.model.substring(0, 4).toUpperCase());
  return parts.join("-");
}

export function getMinMaxPrice(variants: { price: number; isActive: boolean }[]) {
  const active = variants.filter((v) => v.isActive);
  if (!active.length) return { minPrice: 0, maxPrice: 0 };
  const prices = active.map((v) => v.price);
  return { minPrice: Math.min(...prices), maxPrice: Math.max(...prices) };
}

export function generateOrderCode(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `TIB-${dateStr}-${random}`;
}
