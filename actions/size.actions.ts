"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSizes() {
  return prisma.size.findMany({
    orderBy: [
      { category: "asc" },
      { sortOrder: "asc" },
      { label: "asc" },
    ],
  });
}

export async function createSize(data: { label: string; category?: string; sortOrder?: number }) {
  const size = await prisma.size.create({
    data,
  });
  revalidatePath("/admin", "layout");
  return size;
}

export async function updateSize(id: string, data: { label: string; category?: string; sortOrder?: number }) {
  const size = await prisma.size.update({
    where: { id },
    data,
  });
  revalidatePath("/admin", "layout");
  return size;
}

export async function deleteSize(id: string) {
  try {
    // Verificar si la talla tiene variantes asociadas
    const sizeWithVariants = await prisma.size.findUnique({
      where: { id },
      include: { _count: { select: { variants: true } } }
    });

    if (sizeWithVariants && sizeWithVariants._count.variants > 0) {
      throw new Error(`No se puede eliminar la talla porque tiene ${sizeWithVariants._count.variants} variantes de productos asociadas.`);
    }

    await prisma.size.delete({
      where: { id },
    });
    revalidatePath("/admin", "layout");
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Error al eliminar la talla");
  }
}
