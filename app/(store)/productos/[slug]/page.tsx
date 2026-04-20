import { notFound } from "next/navigation";
import { getProductBySlug, getProducts } from "@/actions/product.actions";
import { ProductDetailClient } from "./ProductDetailClient";
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
    limit: 6,
  });

  const filteredRelated = related.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 py-1">
      {/* Pasamos los productos relacionados al cliente para que el sticky funcione */}
      <ProductDetailClient product={product} relatedProducts={filteredRelated} />
    </div>
  );
}
