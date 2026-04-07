import { getSections } from "@/actions/section.actions";
import { SectionsClient } from "@/components/admin/sections/SectionsClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Secciones - Admin" };

export default async function AdminSectionsPage() {
  const sections = await getSections();

  return (
    <div className="container mx-auto">
      <SectionsClient initialSections={sections} />
    </div>
  );
}
