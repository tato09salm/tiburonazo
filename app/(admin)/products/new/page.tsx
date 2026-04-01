import { getAllCategories } from "@/actions/category.actions";
import { ProductForm } from "@/components/admin/products/ProductForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Nuevo Producto - Admin" };

export default async function NewProductPage() {
  const categories = await getAllCategories();
  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-gray-900 mb-6">Nuevo Producto</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
