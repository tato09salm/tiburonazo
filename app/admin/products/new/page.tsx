import { getAdminInitialData } from "@/actions/product.actions";
import { ProductForm } from "@/components/admin/products/ProductForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Nuevo Producto - Admin" };


export default async function NewProductPage() {
  const { categories, colors, sizes, brands, sections } = await getAdminInitialData();

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-gray-900 mb-6">Nuevo Producto</h1>
      <ProductForm 
        categories={categories} 
        colors={colors} 
        sizes={sizes} 
        brands={brands}
        sections={sections}
      />
    </div>
  );
}
