import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCategoryBySlug } from "@/actions/category.actions";
import { ProductGrid } from "@/components/store/product-grid";
import { ProductGridSkeleton } from "@/components/common/Skeleton";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ gender?: string; section?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug);
  return { title: cat?.name ?? "Categoría" };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="section-title">{category.name}</h1>
        {category.description && <p className="text-gray-500 mt-2">{category.description}</p>}
      </div>
      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductGrid categorySlug={slug} gender={sp.gender as never} sectionSlug={sp.section} />
      </Suspense>
    </div>
  );
}
