import { getBrands } from "@/actions/brand.actions";
import { BrandsClient } from "@/components/admin/brands/BrandsClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Marcas - Admin" };

export default async function AdminBrandsPage() {
  const brands = await getBrands();

  return (
    <div className="container mx-auto">
      <BrandsClient initialBrands={brands} />
    </div>
  );
}
