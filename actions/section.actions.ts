"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSections() {
  if (!(prisma as any).section) return [];
  return await prisma.section.findMany({
    orderBy: { order: "asc" },
  });
}

export async function getActiveSections() {
  if (!(prisma as any).section) return [];
  
  const sections = await prisma.section.findMany({
    where: { isActive: true },
    include: {
      variants: {
        where: { isActive: true },
        include: {
          product: {
            select: {
              isActive: true,
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                }
              }
            }
          }
        }
      }
    },
    orderBy: { order: "asc" },
  });

  return sections.map(section => ({
    ...section,
    variants: section.variants.filter(v => v.product?.isActive),
  }));
}

export async function createSection(data: {
  name: string;
  slug: string;
  order: number;
  isActive: boolean;
}) {
  // Verificar unicidad de nombre y slug
  const existing = await prisma.section.findFirst({
    where: {
      OR: [
        { name: { equals: data.name, mode: "insensitive" } },
        { slug: { equals: data.slug, mode: "insensitive" } }
      ]
    }
  });

  if (existing) {
    throw new Error("El nombre o el slug de la sección ya existen");
  }

  const section = await prisma.section.create({
    data,
  });
  revalidatePath("/admin/sections");
  revalidatePath("/");
  return section;
}

export async function updateSection(
  id: string,
  data: {
    name?: string;
    slug?: string;
    order?: number;
    isActive?: boolean;
  }
) {
  // Verificar unicidad si se cambia nombre o slug
  if (data.name || data.slug) {
    const existing = await prisma.section.findFirst({
      where: {
        id: { not: id },
        OR: [
          ...(data.name ? [{ name: { equals: data.name, mode: "insensitive" as const } }] : []),
          ...(data.slug ? [{ slug: { equals: data.slug, mode: "insensitive" as const } }] : [])
        ]
      }
    });

    if (existing) {
      throw new Error("El nombre o el slug de la sección ya existen");
    }
  }

  const section = await prisma.section.update({
    where: { id },
    data,
  });
  revalidatePath("/admin/sections");
  revalidatePath("/");
  return section;
}

export async function deleteSection(id: string) {
  const variantCount = await prisma.productVariant.count({
    where: {
      sections: {
        some: { id }
      }
    }
  });

  if (variantCount > 0) {
    throw new Error("Esta sección está en uso");
  }

  await prisma.section.delete({
    where: { id },
  });
  revalidatePath("/admin/sections");
  revalidatePath("/");
}

export async function toggleSectionStatus(id: string, currentStatus: boolean) {
  const section = await prisma.section.update({
    where: { id },
    data: { isActive: !currentStatus },
  });
  revalidatePath("/admin/sections");
  revalidatePath("/");
  return section;
}
