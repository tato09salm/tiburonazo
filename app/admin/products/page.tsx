import { getAdminProducts, getAdminInitialData } from "@/actions/product.actions";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import type { Metadata } from "next";
import { ToggleProductStatus } from "@/components/admin/products/ToggleProductStatus";
import Image from "next/image";
import { ProductFilters } from "@/components/admin/products/ProductFilters";

export const metadata: Metadata = { title: "Productos - Admin" };

interface Props { searchParams: Promise<{ page?: string; search?: string; category?: string; status?: string }> }

export default async function AdminProductsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);
  const { products, total, pages } = await getAdminProducts(page, sp.search, sp.category, sp.status);
  const { categories } = await getAdminInitialData();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-500 text-sm mt-1">{total} productos en total</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Nuevo producto
        </Link>
      </div>

      <ProductFilters categories={categories} />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left whitespace-nowrap">Producto</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">Código</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">Categoría</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">Precio</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">Stock total</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">Estado</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((p) => {
                const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
                const minPrice = p.variants.length ? Math.min(...p.variants.map((v) => v.price)) : 0;
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                          {p.images[0] ? (
                            <Image 
                              src={p.images[0].url} 
                              alt={p.title} 
                              fill 
                              className="object-cover"
                              sizes="40px"
                              quality={100}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg">🏊</div>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-gray-800 line-clamp-1">{p.title}</span>
                          <span className="text-[11px] text-gray-400 font-medium leading-none mt-0.5">
                            {p.brand?.name || "Sin marca"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono whitespace-nowrap">{p.code}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{p.category.name}</td>
                    <td className="px-4 py-3 font-semibold text-[#11ABC4] whitespace-nowrap">{formatPrice(minPrice)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`badge ${totalStock === 0 ? "bg-red-100 text-red-600" : totalStock < 5 ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-700"}`}>
                        {totalStock} uds.
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {p.isActive ? "Activo" : "Oculto"}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex gap-1.5">
                        <ToggleProductStatus productId={p.id} isActive={p.isActive} />
                        <Link href={`/admin/products/${p.id}/edit`} className="inline-flex items-center gap-1.5 text-xs text-[#11ABC4] hover:bg-[#CCECFB] px-3 py-1.5 rounded-lg transition-colors font-semibold">
                          <Pencil size={13} /> Editar
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">Página {page} de {pages}</span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`/admin/products?page=${page - 1}${sp.search ? `&search=${sp.search}` : ""}`} className="btn-secondary text-sm px-3 py-1.5">Anterior</Link>
              )}
              {page < pages && (
                <Link href={`/admin/products?page=${page + 1}${sp.search ? `&search=${sp.search}` : ""}`} className="btn-primary text-sm px-3 py-1.5">Siguiente</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
