"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/utils";
import { Eye, Ban, ShoppingBag } from "lucide-react";
import { SaleDetailsModal } from "./SaleDetailsModal";
import { cn } from "@/lib/utils";

export function SalesTable({ sales, totalCount }: { sales: any[], totalCount: number }) {
  const [selectedSale, setSelectedSale] = useState<any | null>(null);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-6 py-4 text-left font-bold">Código</th>
              <th className="px-6 py-4 text-left font-bold">NroVenta</th>
              <th className="px-6 py-4 text-left font-bold">Fecha</th>
              <th className="px-6 py-4 text-left font-bold">Tienda</th>
              <th className="px-6 py-4 text-left font-bold">Vendedor</th>
              <th className="px-6 py-4 text-left font-bold">Pago</th>
              <th className="px-6 py-4 text-left font-bold">Estado</th>
              <th className="px-6 py-4 text-right font-bold">Total</th>
              <th className="px-6 py-4 text-center font-bold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sales.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-gray-400 font-medium">
                  No se han registrado ventas aún.
                </td>
              </tr>
            ) : (
              sales.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4 font-mono text-xs text-gray-400 group-hover:text-gray-600 transition-colors">{s.code}</td>
                  <td className="px-6 py-4 font-bold text-gray-700">{s.nroVenta ? String(s.nroVenta).padStart(2, '0') : "—"}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {new Date(s.date).toLocaleDateString("es-PE", { 
                      day: "2-digit", 
                      month: "short", 
                      year: "numeric",
                      timeZone: "UTC" 
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-700">{s.store.name}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{s.vendedor?.name ?? "—"}</td>
                  <td className="px-6 py-4">
                    <span className="badge bg-[#CCECFB] text-[#11ABC4] font-bold text-[10px] uppercase">{s.paymentMethod}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "badge text-[10px] uppercase font-bold",
                      s.status === "ANULADA" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                    )}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-[#11ABC4] text-base">{formatPrice(s.total)}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => setSelectedSale(s)}
                        className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-[#11ABC4] hover:bg-[#CCECFB] hover:border-[#11ABC4] transition-all shadow-sm group/btn"
                        title="Ver detalle"
                      >
                        <Eye size={16} />
                      </button>
                      {s.status !== "ANULADA" && (
                        <button 
                          onClick={() => setSelectedSale(s)}
                          className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm group/btn"
                          title="Anular venta"
                        >
                          <Ban size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
      </table>

      {selectedSale && (
        <SaleDetailsModal 
          sale={selectedSale} 
          onClose={() => setSelectedSale(null)} 
        />
      )}
    </div>
  );
}
