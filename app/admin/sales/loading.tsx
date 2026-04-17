import { ShoppingBag, BarChart3, Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 size={32} className="text-[#11ABC4]" /> Historial de Ventas
          </h1>
          <div className="h-4 w-48 bg-gray-100 animate-pulse rounded mt-1"></div>
        </div>
        <div className="h-12 w-40 bg-gray-100 animate-pulse rounded-xl"></div>
      </div>

      <div className="card p-4 mb-6 bg-white shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-50 animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="font-heading text-lg font-bold flex items-center gap-2">
            <ShoppingBag size={20} className="text-gray-400" /> Todas las ventas
          </h2>
          <div className="h-6 w-24 bg-white animate-pulse rounded-full border border-gray-200"></div>
        </div>
        <div className="p-12 flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-[#11ABC4]" size={40} />
          <p className="text-gray-400 font-medium animate-pulse">Cargando ventas...</p>
        </div>
      </div>
    </div>
  );
}
