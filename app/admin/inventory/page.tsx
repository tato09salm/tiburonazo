import { getInventoryMoves, getLowStockProducts, getStores } from "@/actions/admin.actions";
import { formatPrice } from "@/lib/utils";
import { Warehouse, AlertTriangle, ArrowDown, ArrowUp } from "lucide-react";
import { InventoryMoveForm } from "@/components/admin/inventory/InventoryMoveForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Inventario - Admin" };

export default async function InventoryPage() {
  const [moves, lowStock, stores] = await Promise.all([
    getInventoryMoves(),
    getLowStockProducts(),
    getStores(),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold text-gray-900">Inventario</h1>
        <p className="text-gray-500 text-sm mt-1">Movimientos y alertas de stock</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Move form */}
        <div className="card p-6">
          <h2 className="font-heading text-lg font-bold mb-4 flex items-center gap-2">
            <Warehouse size={18} className="text-[#11ABC4]" /> Registrar movimiento
          </h2>
          <InventoryMoveForm stores={stores} />
        </div>

        {/* Low stock */}
        <div className="card p-6">
          <h2 className="font-heading text-lg font-bold mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-orange-500" /> Stock bajo ({lowStock.length})
          </h2>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {lowStock.length === 0 && <p className="text-gray-400 text-sm">Todo bien ✓</p>}
            {lowStock.map((v) => (
              <div key={v.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-xs font-semibold text-gray-800 line-clamp-1">{v.product.title}</p>
                  <p className="text-xs text-gray-400">{v.sku}</p>
                </div>
                <span className={`badge text-xs ${v.stock === 0 ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"}`}>
                  {v.stock} uds.
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent moves */}
        <div className="card p-6 lg:col-span-3">
          <h2 className="font-heading text-lg font-bold mb-4">Movimientos recientes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-3 py-2 text-left">Fecha</th>
                  <th className="px-3 py-2 text-left">Producto</th>
                  <th className="px-3 py-2 text-left">SKU</th>
                  <th className="px-3 py-2 text-left">Tienda</th>
                  <th className="px-3 py-2 text-left">Tipo</th>
                  <th className="px-3 py-2 text-left">Cantidad</th>
                  <th className="px-3 py-2 text-left">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {moves.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-500 text-xs">{new Date(m.date).toLocaleDateString("es-PE")}</td>
                    <td className="px-3 py-2 font-medium line-clamp-1">{m.variant.product.title}</td>
                    <td className="px-3 py-2 text-gray-500 font-mono text-xs">{m.variant.sku}</td>
                    <td className="px-3 py-2 text-gray-500">{m.store.name}</td>
                    <td className="px-3 py-2">
                      <span className={`badge flex items-center gap-1 w-fit ${m.type === "ENTRADA" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {m.type === "ENTRADA" ? <ArrowDown size={10} /> : <ArrowUp size={10} />}
                        {m.type}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-bold">{m.quantity}</td>
                    <td className="px-3 py-2 text-gray-400 text-xs">{m.reason ?? "—"}</td>
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
