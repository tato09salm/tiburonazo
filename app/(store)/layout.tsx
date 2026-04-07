import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getActiveSections } from "@/actions/section.actions";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const sections = await getActiveSections();

  return (
    <div className="min-h-screen flex flex-col">
      <Header initialSections={sections} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
