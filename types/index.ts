import { Gender, Role, OrderStatus, PaymentMethod, MoveType } from "@prisma/client";

export type { Gender, Role, OrderStatus, PaymentMethod, MoveType };

// ─── Product types ───────────────────────────────────────────────────────────

export interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  order: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  color: { id: string; name: string; hex: string | null } | null;
  size: { id: string; label: string } | null;
  model: string | null;
  price: number;
  oldPrice: number | null;
  stock: number;
  isActive: boolean;
}

export interface ProductCard {
  id: string;
  code: string;
  title: string;
  slug: string;
  gender: Gender;
  category: { name: string; slug: string };
  brand: { name: string } | null;
  images: ProductImage[];
  variants: ProductVariant[];
  minPrice: number;
  maxPrice: number;
}

export interface ProductDetail extends ProductCard {
  description: string | null;
  material: string | null;
  linea: string | null;
  weight: number | null;
}

// ─── Cart ────────────────────────────────────────────────────────────────────

export interface CartItem {
  variantId: string;
  productId: string;
  title: string;
  slug: string;
  image: string;
  color: string | null;
  size: string | null;
  model: string | null;
  price: number;
  quantity: number;
  stock: number;
}

// ─── Filters ─────────────────────────────────────────────────────────────────

export interface ProductFilters {
  search?: string;
  categorySlug?: string;
  gender?: Gender;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  page?: number;
  limit?: number;
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalProducts: number;
  totalSales: number;
  totalRevenue: number;
  lowStockCount: number;
}
