import { HeroSlideForm } from "@/components/admin/hero/HeroSlideForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Nuevo Slide - Admin" };

export default function NewHeroSlidePage() {
  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-gray-900 mb-6">Nuevo Slide</h1>
      <HeroSlideForm />
    </div>
  );
}
