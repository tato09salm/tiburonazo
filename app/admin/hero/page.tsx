import { getHeroSlides } from "@/actions/hero.actions";
import { HeroSlideList } from "@/components/admin/hero/HeroSlideList";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Hero Slider - Admin" };

export default async function AdminHeroPage() {
  const slides = await getHeroSlides();
  return <HeroSlideList initialSlides={slides} />;
}
