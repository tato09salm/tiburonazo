"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getColors() {
  return prisma.color.findMany({
    orderBy: { name: "asc" },
  });
}

export async function createColor(data: { name: string; hex?: string }) {
  const color = await prisma.color.create({
    data,
  });
  revalidatePath("/admin", "layout");
  return color;
}

export async function updateColor(id: string, data: { name: string; hex?: string }) {
  const color = await prisma.color.update({
    where: { id },
    data,
  });
  revalidatePath("/admin", "layout");
  return color;
}

export async function deleteColor(id: string) {
  try {
    // Verificar si el color tiene variantes asociadas
    const colorWithVariants = await prisma.color.findUnique({
      where: { id },
      include: { _count: { select: { variants: true } } }
    });

    if (colorWithVariants && colorWithVariants._count.variants > 0) {
      throw new Error(`No se puede eliminar el color porque tiene ${colorWithVariants._count.variants} variantes de productos asociadas.`);
    }

    await prisma.color.delete({
      where: { id },
    });
    revalidatePath("/admin", "layout");
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Error al eliminar el color");
  }
}
