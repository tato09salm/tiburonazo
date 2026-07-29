"use server";

import { prisma } from "@/lib/prisma";
import { slugify, getMinMaxPrice } from "@/lib/utils";
import { PRODUCTS_PER_PAGE } from "@/lib/constants";
import { revalidatePath } from "next/cache";

export interface GetProductsParams {
  page?: number;
  limit?: number;
  categorySlug?: string;
  sectionSlug?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  brandId?: string;
  featured?: boolean;
  outlet?: boolean;
  gender?: string;
}

export async function getProducts(params: GetProductsParams = {}) {
  const {
    page = 1,
    limit = PRODUCTS_PER_PAGE,
    categorySlug,
    sectionSlug: sectionSlugParam,
    gender: genderParam,
    search,
    minPrice,
    maxPrice,
    brandId,
    featured,
    outlet,
  } = params;

  const genderToSection: Record<string, string> = {
    ADULTO: "unisex-adulto",
    NINO: "nino",
    BEBE: "bebe",
    UNISEX: "unisex",
  };
  const normalizedGender = genderParam?.toUpperCase().replace("Ñ", "N") ?? "";
  const sectionSlug = sectionSlugParam || genderToSection[normalizedGender] || undefined;

  const skip = (page - 1) * limit;

  const where: any = { isActive: true };

  if (categorySlug) {
    where.category = {
      OR: [
        { slug: { equals: categorySlug, mode: "insensitive" } },
        { id: categorySlug }
      ]
    };
  }

  const variantFilters: any = { isActive: true };
  const hasVariantFilter =
    !!sectionSlug ||
    !!outlet ||
    minPrice !== undefined ||
    maxPrice !== undefined;

  if (sectionSlug) {
    variantFilters.sections = {
      some: {
        OR: [
          { slug: { equals: sectionSlug, mode: "insensitive" } },
          { id: sectionSlug },
          { name: { equals: sectionSlug, mode: "insensitive" } }
        ]
      }
    };
  }

  if (outlet) {
    variantFilters.isOutlet = true;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    variantFilters.price = {
      ...(minPrice !== undefined && { gte: minPrice }),
      ...(maxPrice !== undefined && { lte: maxPrice }),
    };
  }

  if (hasVariantFilter) {
    where.variants = { some: variantFilters };
  }

  if (search) where.title = { contains: search, mode: "insensitive" };
  if (brandId) where.brandId = brandId;
  if (featured) where.isFeatured = true;

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
          where: { isActive: true, ...(hasVariantFilter ? variantFilters : {}) },
          include: {
            sections: { select: { id: true, name: true, slug: true } },
            color: { select: { id: true, name: true, hex: true } },
            size: { select: { id: true, label: true } },
            productImage: { select: { id: true, url: true } },
            images: {
              orderBy: { order: "asc" },
              select: { productImage: { select: { id: true, url: true } } },
            },
          },
        },
      },
    }),
    prisma.product.count({ where })
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
          sections: { select: { id: true, name: true, slug: true } },
          color: true,
          size: true,
          productImage: { select: { id: true, url: true } },
          images: {
            orderBy: { order: "asc" },
            select: { productImage: { select: { id: true, url: true } } },
          },
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

export async function getNextProductCode() {
  try {
    const products = await prisma.product.findMany({
      select: { code: true },
    });

    const codes = products.map((p) => p.code.trim().toUpperCase());

    let nextNum = 1;
    while (true) {
      const suggestedCode = `P${nextNum.toString().padStart(3, "0")}`;
      if (!codes.includes(suggestedCode)) {
        return suggestedCode;
      }
      nextNum++;
    }
  } catch (error) {
    console.error("Error al obtener el siguiente código:", error);
    return "";
  }
}

// ─── Admin CRUD ───────────────────────────────────────────────────────────────

interface VariantInput {
  id?: string;
  sku: string;
  colorId?: string;
  sizeId?: string;
  model?: string;
  price: number;
  oldPrice?: number;
  stock: number;
  isOutlet?: boolean;
  sectionIds?: string[];
  productImageId?: string;
  imageIds?: string[];
}

interface ProductImageInput {
  id?: string;
  _key?: string;
  url: string;
  alt?: string;
  order: number;
  colorId?: string;
}

async function syncProductImages(
  tx: any,
  productId: string,
  images: ProductImageInput[]
) {
  const imageIdsToKeep = images.filter((img) => img.id).map((img) => img.id!);
  if (imageIdsToKeep.length === 0) {
    await tx.productImage.deleteMany({
      where: { productId },
    });
  } else {
    await tx.productImage.deleteMany({
      where: {
        productId,
        id: { notIn: imageIdsToKeep },
      },
    });
  }

  const savedImages: Array<{ id: string; _key?: string; url: string }> = [];

  for (const img of images) {
    if (img.id) {
      const updated = await tx.productImage.update({
        where: { id: img.id },
        data: {
          order: img.order,
          colorId: img.colorId || null,
        },
      });
      savedImages.push({ id: updated.id, _key: img._key, url: updated.url });
    } else {
      const created = await tx.productImage.create({
        data: {
          url: img.url,
          order: img.order,
          colorId: img.colorId || null,
          productId,
        },
      });
      savedImages.push({ id: created.id, _key: img._key, url: created.url });
    }
  }

  return savedImages;
}

export async function createProduct(data: {
  code: string;
  title: string;
  description?: string;
  material?: string;
  linea?: string;
  weight?: number;
  categoryId: string;
  brandId?: string | null;
  isFeatured?: boolean;
  variants: VariantInput[];
  images: ProductImageInput[];
}) {
  try {
    const slug = slugify(data.title + "-" + data.code);

    const { product, savedImages } = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          code: data.code,
          title: data.title,
          slug,
          description: data.description,
          material: data.material,
          linea: data.linea || null,
          weight: data.weight,
          category: { connect: { id: data.categoryId } },
          brand: data.brandId ? { connect: { id: data.brandId } } : undefined,
          isFeatured: data.isFeatured,
        },
      });

      const savedImages = await syncProductImages(tx, created.id, data.images || []);

      for (const v of data.variants || []) {
        const imagesForVariant = Array.from(new Set([
          ...(v.imageIds || []),
          ...(v.productImageId ? [v.productImageId] : []),
        ])).filter(Boolean);
        const primaryId = imagesForVariant[0] || v.productImageId || null;

        const createdVariant = await tx.productVariant.create({
          data: {
            sku: v.sku,
            colorId: v.colorId || null,
            sizeId: v.sizeId || null,
            model: v.model || null,
            price: v.price,
            oldPrice: v.oldPrice ?? null,
            stock: v.stock,
            isOutlet: v.isOutlet ?? false,
            productImageId: primaryId,
            productId: created.id,
            sections: v.sectionIds?.length
              ? { connect: v.sectionIds.map((id) => ({ id })) }
              : undefined,
          },
        });

        if (imagesForVariant.length > 0) {
          await tx.variantImage.createMany({
            data: imagesForVariant.map((imgId, idx) => ({
              variantId: createdVariant.id,
              productImageId: imgId,
              order: idx,
            })),
            skipDuplicates: true,
          });
        }
      }

      return { product: created, savedImages };
    });

    revalidatePath("/productos");
    revalidatePath("/admin/products");
    revalidatePath("/");
    return { ...product, savedImages };
  } catch (err: any) {
    if (err.code === "P2002") {
      if (err.meta?.target?.includes("variant")) {
        throw new Error("Un SKU de variante ya existe");
      }
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
    isActive: boolean;
    isFeatured: boolean;
    categoryId: string;
    brandId: string | null;
    images: ProductImageInput[];
  }>
) {
  try {
    const { images, categoryId, brandId, ...rest } = data;

    const result = await prisma.$transaction(async (tx) => {
      const updateData: any = {
        ...rest,
        linea: rest.linea || null,
      };

      if (categoryId) {
        updateData.category = { connect: { id: categoryId } };
      }

      if (brandId !== undefined) {
        updateData.brand = brandId ? { connect: { id: brandId } } : { disconnect: true };
      }

      const updatedProduct = await tx.product.update({
        where: { id },
        data: updateData
      });

      let savedImages: Awaited<ReturnType<typeof syncProductImages>> = [];
      if (images) {
        savedImages = await syncProductImages(tx, id, images);
      }

      return { product: updatedProduct, savedImages };
    });

    revalidatePath("/productos");
    revalidatePath("/admin/products");
    revalidatePath("/");
    return { ...result.product, savedImages: result.savedImages };
  } catch (err: any) {
    if (err.code === "P2002") {
      throw new Error("El codigo del producto ya existe");
    }
    throw err;
  }
}

export async function deleteProduct(id: string) {
  try {
    const productWithDeps = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        variants: {
          select: {
            id: true,
            _count: {
              select: {
                orderItems: true,
                saleItems: true,
                inventoryMoves: true,
              },
            },
          },
        },
      },
    });

    if (!productWithDeps) {
      throw new Error("El producto no existe");
    }

    const totalOrderItems = productWithDeps.variants.reduce((s, v) => s + v._count.orderItems, 0);
    const totalSaleItems = productWithDeps.variants.reduce((s, v) => s + v._count.saleItems, 0);
    const totalInventoryMoves = productWithDeps.variants.reduce((s, v) => s + v._count.inventoryMoves, 0);

    if (totalOrderItems > 0 || totalSaleItems > 0 || totalInventoryMoves > 0) {
      const parts: string[] = [];
      if (totalOrderItems > 0) parts.push(`${totalOrderItems} item(es) en pedidos`);
      if (totalSaleItems > 0) parts.push(`${totalSaleItems} item(es) en ventas`);
      if (totalInventoryMoves > 0) parts.push(`${totalInventoryMoves} movimiento(s) de inventario`);
      throw new Error(`No se puede eliminar el producto porque tiene ${parts.join(", ")}.`);
    }

    await prisma.$transaction(async (tx) => {
      const variantIds = productWithDeps.variants.map((v) => v.id);

      if (variantIds.length > 0) {
        await tx.productVariant.deleteMany({
          where: { id: { in: variantIds } },
        });
      }

      await tx.productImage.deleteMany({
        where: { productId: id },
      });

      await tx.product.delete({
        where: { id },
      });
    });

    revalidatePath("/admin/products");
    revalidatePath("/", "layout");
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    throw error;
  }
}

export async function deleteVariant(id: string) {
  const variantWithDeps = await prisma.productVariant.findUnique({
    where: { id },
    select: {
      _count: {
        select: {
          orderItems: true,
          saleItems: true,
          inventoryMoves: true,
        },
      },
    },
  });

  if (!variantWithDeps) {
    throw new Error("La variante no existe");
  }

  const { orderItems, saleItems, inventoryMoves } = variantWithDeps._count;
  if (orderItems > 0 || saleItems > 0 || inventoryMoves > 0) {
    const parts: string[] = [];
    if (orderItems > 0) parts.push(`${orderItems} item(es) en pedidos`);
    if (saleItems > 0) parts.push(`${saleItems} item(es) en ventas`);
    if (inventoryMoves > 0) parts.push(`${inventoryMoves} movimiento(s) de inventario`);
    throw new Error(`No se puede eliminar la variante porque tiene ${parts.join(", ")}.`);
  }

  await prisma.productVariant.delete({ where: { id } });
  revalidatePath("/admin/products");
}

export async function upsertVariant(
  productId: string,
  data: {
    id?: string;
    sku: string;
    colorId?: string;
    sizeId?: string;
    model?: string;
    price: number;
    oldPrice?: number;
    stock: number;
    isOutlet?: boolean;
    sectionIds?: string[];
    productImageId?: string;
    imageIds?: string[];
  }
) {
  const { id, sectionIds, productImageId, imageIds: imageIdsIn, ...rest } = data;
  const uniqueImageIds = Array.from(new Set([
    ...(imageIdsIn || []),
    ...(productImageId ? [productImageId] : []),
  ])).filter(Boolean);
  const primaryId = uniqueImageIds[0] || productImageId || null;

  if (id) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.productVariant.update({
        where: { id },
        data: {
          ...rest,
          productImageId: primaryId,
          sections: sectionIds
            ? { set: sectionIds.map((s) => ({ id: s })) }
            : undefined,
        },
      });

      await tx.variantImage.deleteMany({ where: { variantId: id } });
      if (uniqueImageIds.length > 0) {
        await tx.variantImage.createMany({
          data: uniqueImageIds.map((imgId, idx) => ({
            variantId: id,
            productImageId: imgId,
            order: idx,
          })),
          skipDuplicates: true,
        });
      }

      return updated;
    });
  }
  return prisma.$transaction(async (tx) => {
    const created = await tx.productVariant.create({
      data: {
        ...rest,
        productImageId: primaryId,
        productId,
        sections: sectionIds?.length
          ? { connect: sectionIds.map((id) => ({ id })) }
          : undefined,
      },
    });
    if (uniqueImageIds.length > 0) {
      await tx.variantImage.createMany({
        data: uniqueImageIds.map((imgId, idx) => ({
          variantId: created.id,
          productImageId: imgId,
          order: idx,
        })),
        skipDuplicates: true,
      });
    }
    return created;
  });
}

export async function getAdminInitialData() {
  const [categories, colors, sizes, brands, sections] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.color.findMany({ orderBy: { name: "asc" } }),
    prisma.size.findMany({ orderBy: { label: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.section.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
  ]);
  return { categories, colors, sizes, brands, sections };
}

export async function getAdminProducts(page = 1, search = "", categoryId = "", status = "") {
  const limit = 20;
  const skip = (page - 1) * limit;
  const where: any = {};

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" as const } },
      { code: { contains: search, mode: "insensitive" as const } },
    ];
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (status) {
    where.isActive = status === "active";
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true } },
        brand: { select: { name: true } },
        variants: {
          select: {
            stock: true,
            price: true,
            productImage: { select: { id: true, url: true } },
            images: {
              orderBy: { order: "asc" },
              select: { productImage: { select: { id: true, url: true } } },
            },
          },
        },
        images: { take: 1 },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total, pages: Math.ceil(total / limit) };
}

export async function getProductForEdit(id: string) {
  const raw = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: {
      include: {
          sections: { select: { id: true, name: true } },
          color: { select: { id: true, name: true } },
          size: { select: { id: true, label: true } },
          productImage: { select: { id: true, url: true } },
          images: {
            orderBy: { order: "asc" },
            select: { productImage: { select: { id: true, url: true } } },
          },
        },
      },
      images: { orderBy: { order: "asc" } },
      category: { select: { id: true, name: true } },
      brand: { select: { id: true, name: true } },
    },
  });

  if (!raw) return null;

  const variants = raw.variants.map((v: any) => {
    const explicit = (v.images || []).map((l: any) => l.productImage).filter(Boolean);
    if (explicit.length > 0) {
      return { ...v, allImages: explicit };
    }
    if (v.productImage) {
      return { ...v, allImages: [v.productImage] };
    }
    return { ...v, allImages: [] };
  });

  return { ...raw, variants };
}
