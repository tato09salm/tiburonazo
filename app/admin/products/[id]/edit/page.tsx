import { prisma } from "@/lib/prisma";
import { getAdminInitialData } from "@/actions/product.actions";
import { ProductForm } from "@/components/admin/products/ProductForm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface Props { params: Promise<{ id: string }> }

export const metadata: Metadata = { title: "Editar Producto - Admin" };

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const [product, initialData] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { variants: true, images: { orderBy: { order: "asc" } } },
    }),
    getAdminInitialData(),
  ]);

  if (!product) notFound();

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-gray-900 mb-6">Editar: {product.title}</h1>
      <ProductForm 
        categories={initialData.categories} 
        colors={initialData.colors} 
        sizes={initialData.sizes} 
        brands={initialData.brands} 
        product={product} 
      />
    </div>
  );
}
