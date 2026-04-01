import { notFound } from "next/navigation";
import { getProductBySlug, getProducts } from "@/actions/product.actions";
import { ProductDetailClient } from "./ProductDetailClient";
import { ProductCardComponent } from "@/components/store/product-card";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Producto no encontrado" };
  return {
    title: product.title,
    description: product.description ?? `${product.title} - Tiburonazo`,
    openGraph: { images: product.images[0] ? [product.images[0].url] : [] },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const { products: related } = await getProducts({
    categorySlug: product.category.slug,
    limit: 4,
  });

  const filtered = related.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <ProductDetailClient product={product} />

      {filtered.length > 0 && (
        <section className="mt-16">
          <h2 className="section-title mb-6">También te puede gustar</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filtered.map((p) => (
              <ProductCardComponent key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
