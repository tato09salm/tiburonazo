import { getHeroSlideById } from "@/actions/hero.actions";
import { HeroSlideForm } from "@/components/admin/hero/HeroSlideForm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Editar Slide - Admin" };

interface Props { params: Promise<{ id: string }> }

export default async function EditHeroSlidePage({ params }: Props) {
  const { id } = await params;
  const slide = await getHeroSlideById(id);
  if (!slide) notFound();

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-gray-900 mb-6">Editar Slide</h1>
      <HeroSlideForm slide={slide} />
    </div>
  );
}
