"use server";

import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function getCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { children: true, _count: { select: { products: true } } },
    where: { parentId: null },
  });
}

export async function getAllCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({ where: { slug }, include: { children: true } });
}

export async function createCategory(data: { name: string; description?: string; imageUrl?: string; parentId?: string }) {
  const slug = slugify(data.name);
  const cat = await prisma.category.create({ data: { ...data, slug } });
  revalidatePath("/admin/categories");
  revalidatePath("/");
  return cat;
}

export async function updateCategory(id: string, data: Partial<{ name: string; description: string; imageUrl: string; parentId: string }>) {
  const updateData = { ...data };
  if (data.name) {
    updateData.name = data.name;
    // @ts-ignore
    updateData.slug = slugify(data.name);
  }
  const cat = await prisma.category.update({ 
    where: { id }, 
    // @ts-ignore
    data: updateData 
  });
  revalidatePath("/admin/categories");
  revalidatePath("/");
  return cat;
}

export async function deleteCategory(id: string) {
  try {
    // Verificar si tiene productos asociados
    const categoryWithProducts = await prisma.category.findUnique({
      where: { id },
      include: { 
        _count: { select: { products: true } },
        children: { select: { id: true } }
      }
    });

    if (categoryWithProducts && categoryWithProducts._count.products > 0) {
      throw new Error(`No se puede eliminar la categoría porque tiene ${categoryWithProducts._count.products} productos asociados.`);
    }

    if (categoryWithProducts && categoryWithProducts.children.length > 0) {
      throw new Error(`No se puede eliminar la categoría porque tiene subcategorías asociadas.`);
    }

    await prisma.category.delete({ where: { id } });
    revalidatePath("/admin/categories");
    revalidatePath("/");
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("Error al eliminar la categoría");
  }
}
