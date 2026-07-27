"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const heroSlideSchema = z.object({
  title: z.string().min(1, "El título es obligatorio"),
  subtitle: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  badge: z.string().optional().nullable(),
  button1Text: z.string().optional().nullable(),
  button1Url: z.string().url("URL inválida").optional().nullable().or(z.literal("")),
  button2Text: z.string().optional().nullable(),
  button2Url: z.string().url("URL inválida").optional().nullable().or(z.literal("")),
  imageUrl: z.string().optional().nullable(),
  gifUrl: z.string().optional().nullable(),
  backgroundImageUrl: z.string().optional().nullable(),
  backgroundColor: z.string().optional().nullable(),
  textColor: z.string().default("#FFFFFF"),
  buttonColor: z.string().default("#11ABC4"),
  contentPosition: z.enum(["LEFT", "CENTER", "RIGHT"]).default("LEFT"),
  isActive: z.boolean().default(true),
  order: z.number().int().default(0),
  displayDuration: z.number().int().min(3).max(10).default(5),
  canvasData: z.any().optional().nullable(),
});

export type HeroSlideInput = z.infer<typeof heroSlideSchema>;

export async function getHeroSlides() {
  const slides = await prisma.heroSlide.findMany({
    orderBy: { order: "asc" },
  });
  return slides;
}

export async function getActiveHeroSlides() {
  const slides = await prisma.heroSlide.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });
  return slides;
}

export async function getHeroSlideById(id: string) {
  return prisma.heroSlide.findUnique({ where: { id } });
}

export async function createHeroSlide(data: HeroSlideInput) {
  const parsed = heroSlideSchema.parse(data);

  const maxOrder = await prisma.heroSlide.aggregate({ _max: { order: true } });
  const nextOrder = (maxOrder._max.order ?? -1) + 1;

  await prisma.heroSlide.create({
    data: { ...parsed, order: parsed.order ?? nextOrder },
  });

  revalidatePath("/admin/hero");
  revalidatePath("/");
}

export async function updateHeroSlide(id: string, data: HeroSlideInput) {
  const parsed = heroSlideSchema.parse(data);

  await prisma.heroSlide.update({
    where: { id },
    data: parsed,
  });

  revalidatePath("/admin/hero");
  revalidatePath("/");
}

export async function deleteHeroSlide(id: string) {
  await prisma.heroSlide.delete({ where: { id } });
  revalidatePath("/admin/hero");
  revalidatePath("/");
}

export async function duplicateHeroSlide(id: string) {
  const original = await prisma.heroSlide.findUnique({ where: { id } });
  if (!original) throw new Error("Slide no encontrado");

  const maxOrder = await prisma.heroSlide.aggregate({ _max: { order: true } });

  await prisma.heroSlide.create({
    data: {
      title: `${original.title} (copia)`,
      subtitle: original.subtitle,
      description: original.description,
      badge: original.badge,
      button1Text: original.button1Text,
      button1Url: original.button1Url,
      button2Text: original.button2Text,
      button2Url: original.button2Url,
      imageUrl: original.imageUrl,
      gifUrl: original.gifUrl,
      backgroundImageUrl: original.backgroundImageUrl,
      backgroundColor: original.backgroundColor,
      textColor: original.textColor,
      buttonColor: original.buttonColor,
      contentPosition: original.contentPosition,
      isActive: false,
      order: (maxOrder._max.order ?? 0) + 1,
      displayDuration: original.displayDuration,
      canvasData: original.canvasData as any,
    },
  });

  revalidatePath("/admin/hero");
}

export async function toggleHeroSlideStatus(id: string) {
  const slide = await prisma.heroSlide.findUnique({ where: { id } });
  if (!slide) throw new Error("Slide no encontrado");

  await prisma.heroSlide.update({
    where: { id },
    data: { isActive: !slide.isActive },
  });

  revalidatePath("/admin/hero");
  revalidatePath("/");
}

export async function reorderHeroSlides(ids: string[]) {
  const updates = ids.map((id, index) =>
    prisma.heroSlide.update({ where: { id }, data: { order: index } })
  );
  await prisma.$transaction(updates);
  revalidatePath("/admin/hero");
  revalidatePath("/");
}
