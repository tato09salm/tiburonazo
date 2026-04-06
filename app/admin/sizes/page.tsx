import { getSizes } from "@/actions/size.actions";
import { getAllCategories } from "@/actions/category.actions";
import { SizesClient } from "@/components/admin/sizes/SizesClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tallas - Admin" };

export default async function AdminSizesPage() {
  const [sizes, categories] = await Promise.all([
    getSizes(),
    getAllCategories(),
  ]);

  return (
    <div className="container mx-auto">
      <SizesClient 
        initialSizes={sizes} 
        productCategories={categories.map(c => c.name)} 
      />
    </div>
  );
}
