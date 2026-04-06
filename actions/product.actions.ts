"use server";

import { prisma } from "@/lib/prisma";
import { slugify, getMinMaxPrice } from "@/lib/utils";
import { PRODUCTS_PER_PAGE } from "@/lib/constants";
import { Gender } from "@prisma/client";
import { revalidatePath } from "next/cache";

export interface GetProductsParams {
  page?: number;
  limit?: number;
  categorySlug?: string;
  gender?: Gender;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  brandId?: string;
  featured?: boolean;
}

export async function getProducts(params: GetProductsParams = {}) {
  const {
    page = 1,
    limit = PRODUCTS_PER_PAGE,
    categorySlug,
    gender,
    search,
    minPrice,
    maxPrice,
    brandId,
    featured,
  } = params;

  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { isActive: true };

  if (categorySlug) where.category = { slug: categorySlug };
  if (gender) where.gender = gender;
  if (search) where.title = { contains: search, mode: "insensitive" };
  if (brandId) where.brandId = brandId;
  if (featured) where.isFeatured = true;
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.variants = {
      some: {
        isActive: true,
        price: {
          ...(minPrice !== undefined && { gte: minPrice }),
          ...(maxPrice !== undefined && { lte: maxPrice }),
        },
      },
    };
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true, slug: true } },
        brand: { select: { name: true } },
        images: { orderBy: { order: "asc" }, take: 2 },
        variants: {
          where: { isActive: true },
          include: {
            color: { select: { name: true, hex: true } },
            size: { select: { label: true } },
          },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  const mapped = products.map((p) => {
    const { minPrice, maxPrice } = getMinMaxPrice(p.variants);
    return { ...p, minPrice, maxPrice };
  });

  return { products: mapped, total, pages: Math.ceil(total / limit), page };
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    include: {
      category: { select: { name: true, slug: true } },
      brand: { select: { name: true } },
      images: { orderBy: { order: "asc" } },
      variants: {
        where: { isActive: true },
        orderBy: { price: "asc" },
        include: {
          color: true,
          size: true,
        },
      },
    },
  });

  if (!product) return null;
  const { minPrice, maxPrice } = getMinMaxPrice(product.variants);
  return { ...product, minPrice, maxPrice };
}

export async function getFeaturedProducts() {
  return getProducts({ featured: true, limit: 8 });
}

// ─── Admin CRUD ───────────────────────────────────────────────────────────────

export async function createProduct(data: {
  code: string;
  title: string;
  description?: string;
  material?: string;
  linea?: string;
  gender: Gender;
  weight?: number;
  categoryId: string;
  brandId?: string;
  isFeatured?: boolean;
  variants: Array<{ sku: string; color?: string; size?: string; model?: string; price: number; oldPrice?: number; stock: number }>;
  images: Array<{ url: string; alt?: string; order: number }>;
}) {
  try {
    const slug = slugify(data.title + "-" + data.code);

    const product = await prisma.product.create({
      data: {
        code: data.code,
        title: data.title,
        slug,
        description: data.description,
        material: data.material,
        linea: data.linea || null,
        gender: data.gender,
        weight: data.weight,
        categoryId: data.categoryId,
        brandId: data.brandId,
        isFeatured: data.isFeatured,
        variants: { create: data.variants },
        images: { create: data.images },
      },
      include: { variants: true, images: true },
    });

    revalidatePath("/productos");
    revalidatePath("/admin/products");
    return product;
  } catch (err: any) {
    if (err.code === "P2002") {
      throw new Error("El codigo del producto ya existe");
    }
    throw err;
  }
}

export async function updateProduct(
  id: string,
  data: Partial<{ 
    title: string; 
    description: string; 
    material: string; 
    linea: string; 
    gender: Gender; 
    isActive: boolean; 
    isFeatured: boolean; 
    categoryId: string; 
    brandId: string | null;
    images: Array<{ id?: string; url: string; order: number; colorId?: string }>;
  }>
) {
  try {
    const { images, ...rest } = data;
    
    // Usar una transacción para actualizar producto e imágenes
    const product = await prisma.$transaction(async (tx) => {
      // 1. Actualizar datos básicos del producto
      const updatedProduct = await tx.product.update({ 
        where: { id }, 
        data: {
          ...rest,
          linea: rest.linea || null
        } 
      });

      // 2. Gestionar imágenes si se proporcionan
      if (images) {
        // Eliminar imágenes que ya no están en la lista
        const imageIdsToKeep = images.filter(img => img.id).map(img => img.id!);
        await tx.productImage.deleteMany({
          where: {
            productId: id,
            id: { notIn: imageIdsToKeep }
          }
        });

        // Actualizar o crear nuevas imágenes
        for (const img of images) {
          if (img.id) {
            await tx.productImage.update({
              where: { id: img.id },
              data: { 
                order: img.order,
                colorId: img.colorId || null
              }
            });
          } else {
            await tx.productImage.create({
              data: {
                url: img.url,
                order: img.order,
                colorId: img.colorId || null,
                productId: id
              }
            });
          }
        }
      }

      return updatedProduct;
    });

    revalidatePath("/productos");
    revalidatePath("/admin/products");
    return product;
  } catch (err: any) {
    if (err.code === "P2002") {
      throw new Error("El codigo del producto ya existe");
    }
    throw err;
  }
}

export async function deleteProduct(id: string) {
  await prisma.product.update({ where: { id }, data: { isActive: false } });
  revalidatePath("/admin/products");
}

export async function deleteVariant(id: string) {
  await prisma.productVariant.delete({ where: { id } });
  revalidatePath("/admin/products");
}

export async function upsertVariant(productId: string, data: {
  id?: string;
  sku: string;
  colorId?: string;
  sizeId?: string;
  model?: string;
  price: number;
  oldPrice?: number;
  stock: number;
}) {
  const { id, ...rest } = data;
  if (id) {
    return prisma.productVariant.update({ 
      where: { id }, 
      data: rest 
    });
  }
  return prisma.productVariant.create({ 
    data: { ...rest, productId } 
  });
}

export async function getAdminInitialData() {
  const [categories, colors, sizes, brands] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.color.findMany({ orderBy: { name: "asc" } }),
    prisma.size.findMany({ orderBy: { label: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
  ]);
  return { categories, colors, sizes, brands };
}

export async function getAdminProducts(page = 1, search = "") {
  const limit = 20;
  const skip = (page - 1) * limit;
  const where = search ? { title: { contains: search, mode: "insensitive" as const } } : {};

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true } },
        brand: { select: { name: true } },
        variants: { select: { stock: true, price: true } },
        images: { take: 1 },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total, pages: Math.ceil(total / limit) };
}
