import { Suspense } from "react";
import { ProductGrid } from "@/components/store/product-grid";
import { ProductGridSkeleton } from "@/components/common/Skeleton";
import { getAllCategories } from "@/actions/category.actions";
import { GENDERS } from "@/lib/constants";
import { Gender } from "@prisma/client";
import { SlidersHorizontal } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Productos" };

interface Props {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const categories = await getAllCategories();

  const filters = {
    categorySlug: params.categorySlug,
    gender: params.gender as Gender | undefined,
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

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Categoría</label>
              <select name="categorySlug" defaultValue={params.categorySlug ?? ""} className="input text-sm">
                <option value="">Todas</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Público</label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="gender" value="" defaultChecked={!params.gender} className="accent-[#11ABC4]" />
                  <span className="text-sm">Todos</span>
                </label>
                {GENDERS.map((g) => (
                  <label key={g.value} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="gender" value={g.value} defaultChecked={params.gender === g.value} className="accent-[#11ABC4]" />
                    <span className="text-sm">{g.label}</span>
                  </label>
                ))}
              </div>
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
