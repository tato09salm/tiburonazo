import { getColors } from "@/actions/color.actions";
import { ColorsClient } from "@/components/admin/colors/ColorsClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Colores - Admin" };

export default async function AdminColorsPage() {
  const colors = await getColors();

  return (
    <div className="container mx-auto">
      <ColorsClient initialColors={colors} />
    </div>
  );
}
