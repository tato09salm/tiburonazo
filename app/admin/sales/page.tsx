import { getSales, getTodaySalesTotal, getVendedores } from "@/actions/admin.actions";
import { formatPrice } from "@/lib/utils";
import { BarChart3, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { SalesTable } from "@/components/admin/sales/SalesTable";
import { SalesFilters } from "@/components/admin/sales/SalesFilters";

export const metadata: Metadata = { title: "Ventas - Admin" };
export const dynamic = "force-dynamic";

export default async function SalesPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await searchParamsPromise;
  const page = Number(searchParams.page ?? 1);
  
  // Normalizar fechas para búsqueda (UTC para coincidir con el almacenamiento)
  let from: Date | undefined = undefined;
  let to: Date | undefined = undefined;

  if (searchParams.from) {
    const fromDate = new Date(searchParams.from as string);
    from = new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate(), 0, 0, 0, 0));
  }

  if (searchParams.to) {
    const toDate = new Date(searchParams.to as string);
    to = new Date(Date.UTC(toDate.getUTCFullYear(), toDate.getUTCMonth(), toDate.getUTCDate(), 23, 59, 59, 999));
  }
  
  const [{ sales, count, pages }, totalToday, vendedores] = await Promise.all([
    getSales({
      from,
      to,
      vendedorId: Array.isArray(searchParams.vendedorId) ? searchParams.vendedorId[0] : searchParams.vendedorId,
      paymentMethod: Array.isArray(searchParams.paymentMethod) ? searchParams.paymentMethod[0] : searchParams.paymentMethod,
      status: Array.isArray(searchParams.status) ? searchParams.status[0] : searchParams.status,
      client: Array.isArray(searchParams.client) ? searchParams.client[0] : searchParams.client,
      minTotal: searchParams.minTotal ? Number(searchParams.minTotal) : undefined,
      maxTotal: searchParams.maxTotal ? Number(searchParams.maxTotal) : undefined,
      page,
      take: 10,
    }),
    getTodaySalesTotal(),
    getVendedores()
  ]);

  // Construir URL base para paginación manteniendo filtros
  const getPageUrl = (newPage: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== 'page') params.set(key, String(value));
    });
    params.set('page', String(newPage));
    return `?${params.toString()}`;
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 size={32} className="text-[#11ABC4]" /> Historial de Ventas
          </h1>
          <p className="text-gray-500 text-sm mt-1">Hoy se han vendido: <span className="text-[#11ABC4] font-bold">{formatPrice(totalToday)}</span></p>
        </div>
        <Link 
          href="/admin/sales/new" 
          className="btn-primary px-6 py-3 flex items-center justify-center gap-2 shadow-lg shadow-[#11ABC4]/20"
        >
          <Plus size={20} /> Registrar venta
        </Link>
      </div>

      <SalesFilters vendedores={vendedores} />

      <div className="card overflow-hidden">
        <SalesTable sales={sales} totalCount={count} />
        
        {pages > 1 && (
          <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Página <span className="text-[#11ABC4]">{page}</span> de {pages}
              <span className="mx-2 text-gray-200">|</span>
              Total: <span className="text-gray-600">{count} ventas</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Link 
                href={getPageUrl(page - 1)}
                className={`flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  page <= 1 
                  ? "bg-gray-100 text-gray-300 pointer-events-none" 
                  : "bg-white text-gray-600 hover:bg-[#CCECFB] hover:text-[#11ABC4] shadow-sm"
                }`}
              >
                <ChevronLeft size={14} /> Anterior
              </Link>
              
              <div className="flex gap-1 hidden sm:flex">
                {[...Array(pages)].map((_, i) => {
                  const p = i + 1;
                  // Mostrar solo algunas páginas si hay muchas
                  if (pages > 7 && Math.abs(p - page) > 2 && p !== 1 && p !== pages) {
                    if (Math.abs(p - page) === 3) return <span key={p} className="px-1 text-gray-300">...</span>;
                    return null;
                  }
                  return (
                    <Link
                      key={p}
                      href={getPageUrl(p)}
                      className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-bold transition-all ${
                        page === p 
                        ? "bg-[#11ABC4] text-white shadow-md shadow-[#11ABC4]/20" 
                        : "bg-white text-gray-600 hover:bg-gray-100 shadow-sm"
                      }`}
                    >
                      {p}
                    </Link>
                  );
                })}
              </div>

              <Link 
                href={getPageUrl(page + 1)}
                className={`flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  page >= pages 
                  ? "bg-gray-100 text-gray-300 pointer-events-none" 
                  : "bg-white text-gray-600 hover:bg-[#CCECFB] hover:text-[#11ABC4] shadow-sm"
                }`}
              >
                Siguiente <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

