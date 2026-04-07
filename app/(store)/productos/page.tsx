import { Suspense } from "react";
import { ProductGrid } from "@/components/store/product-grid";
import { ProductGridSkeleton } from "@/components/common/Skeleton";
import { getAllCategories } from "@/actions/category.actions";
import { getSections } from "@/actions/section.actions";
import { SlidersHorizontal } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Productos" };

interface Props {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const [categories, sections] = await Promise.all([
    getAllCategories(),
    getSections(),
  ]);

  const activeSectionSlug = params.section || params.gender || params.sectionSlug;

  const filters = {
    categorySlug: params.categorySlug || params.category,
    sectionSlug: activeSectionSlug,
    search: params.search,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">
            {params.search ? `Resultados para "${params.search}"` : "Todos los productos"}
          </h1>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters */}
        <aside className="hidden md:block w-60 flex-shrink-0">
          <form method="GET" className="space-y-6 sticky top-24">
            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Buscar</label>
              <input
                type="text"
                name="search"
                defaultValue={params.search}
                placeholder="Nombre del producto..."
                className="input text-sm"
              />
            </div>

            {/* Section */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sección</label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="section" value="" defaultChecked={!activeSectionSlug} className="accent-[#11ABC4]" />
                  <span className="text-sm">Todas</span>
                </label>
                {sections.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="section" 
                      value={s.slug} 
                      defaultChecked={
                        activeSectionSlug?.toLowerCase() === s.slug.toLowerCase() || 
                        activeSectionSlug?.toLowerCase() === s.name.toLowerCase() ||
                        activeSectionSlug?.toLowerCase() === s.id.toLowerCase()
                      } 
                      className="accent-[#11ABC4]" 
                    />
                    <span className="text-sm">{s.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Categoría</label>
              <select 
                name="categorySlug" 
                defaultValue={params.categorySlug ?? params.category ?? ""} 
                className="input text-sm"
              >
                <option value="">Todas</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Precio (S/.)</label>
              <div className="flex gap-2">
                <input type="number" name="minPrice" placeholder="Mín" defaultValue={params.minPrice} className="input text-sm w-1/2" min={0} />
                <input type="number" name="maxPrice" placeholder="Máx" defaultValue={params.maxPrice} className="input text-sm w-1/2" min={0} />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
              <SlidersHorizontal size={16} /> Filtrar
            </button>
            <a href="/productos" className="block text-center text-sm text-gray-400 hover:text-[#11ABC4]">Limpiar filtros</a>
          </form>
        </aside>

        {/* Products */}
        <div className="flex-1 min-w-0">
          <Suspense fallback={<ProductGridSkeleton />}>
            <ProductGrid {...filters} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
