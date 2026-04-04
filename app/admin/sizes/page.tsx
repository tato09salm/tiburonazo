import { getSizes } from "@/actions/size.actions";
import { SizesClient } from "@/components/admin/sizes/SizesClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tallas - Admin" };

export default async function AdminSizesPage() {
  const sizes = await getSizes();

  return (
    <div className="container mx-auto">
      <SizesClient initialSizes={sizes} />
    </div>
  );
}
