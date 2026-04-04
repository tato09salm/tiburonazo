"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getBrands() {
  return prisma.brand.findMany({
    orderBy: { name: "asc" },
  });
}

export async function createBrand(data: { name: string; logoUrl?: string }) {
  const brand = await prisma.brand.create({
    data,
  });
  revalidatePath("/admin", "layout");
  return brand;
}

export async function updateBrand(id: string, data: { name: string; logoUrl?: string }) {
  const brand = await prisma.brand.update({
    where: { id },
    data,
  });
  revalidatePath("/admin", "layout");
  return brand;
}

export async function deleteBrand(id: string) {
  try {
    // Verificar si la marca tiene productos asociados
    const brandWithProducts = await prisma.brand.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } }
    });

    if (brandWithProducts && brandWithProducts._count.products > 0) {
      throw new Error(`No se puede eliminar la marca porque tiene ${brandWithProducts._count.products} productos asociados.`);
    }

    await prisma.brand.delete({
      where: { id },
    });
    revalidatePath("/admin", "layout");
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Error al eliminar la marca");
  }
}
