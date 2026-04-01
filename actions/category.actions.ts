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
  const cat = await prisma.category.update({ where: { id }, data });
  revalidatePath("/admin/categories");
  return cat;
}

export async function deleteCategory(id: string) {
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
}
