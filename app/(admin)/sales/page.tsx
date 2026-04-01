import { getSales, getStores } from "@/actions/admin.actions";
import { formatPrice } from "@/lib/utils";
import { BarChart3 } from "lucide-react";
import { SaleForm } from "@/components/admin/sales/SaleForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Ventas - Admin" };

export default async function SalesPage() {
  const [sales, stores] = await Promise.all([getSales(), getStores()]);

  const totalToday = sales
    .filter((s) => new Date(s.date).toDateString() === new Date().toDateString())
    .reduce((t, s) => t + s.total, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold text-gray-900">Ventas</h1>
        <p className="text-gray-500 text-sm mt-1">Hoy: <span className="text-[#11ABC4] font-bold">{formatPrice(totalToday)}</span></p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Register sale */}
        <div className="card p-6">
          <h2 className="font-heading text-lg font-bold mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-[#11ABC4]" /> Registrar venta
          </h2>
          <SaleForm stores={stores} />
        </div>

        {/* Sales table */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-heading text-lg font-bold">Historial de ventas</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Código</th>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Tienda</th>
                  <th className="px-4 py-3 text-left">Vendedor</th>
                  <th className="px-4 py-3 text-left">Pago</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{s.code}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{new Date(s.date).toLocaleDateString("es-PE")}</td>
                    <td className="px-4 py-2.5 font-medium">{s.store.name}</td>
                    <td className="px-4 py-2.5 text-gray-500">{s.vendedor?.name ?? "—"}</td>
                    <td className="px-4 py-2.5">
                      <span className="badge bg-blue-50 text-blue-600">{s.paymentMethod}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-[#11ABC4]">{formatPrice(s.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
