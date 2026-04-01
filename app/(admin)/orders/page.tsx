import { getAdminOrders, updateOrderStatus } from "@/actions/order.actions";
import { formatPrice } from "@/lib/utils";
import { ShoppingBag } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Pedidos - Admin" };

const STATUS_COLORS: Record<string, string> = {
  PENDIENTE: "bg-yellow-100 text-yellow-700",
  PAGADO: "bg-blue-100 text-blue-700",
  ENVIADO: "bg-purple-100 text-purple-700",
  ENTREGADO: "bg-green-100 text-green-700",
  CANCELADO: "bg-red-100 text-red-600",
};

interface Props { searchParams: Promise<{ page?: string }> }

export default async function AdminOrdersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { orders, total, pages } = await getAdminOrders(Number(sp.page ?? 1));

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold text-gray-900 flex items-center gap-2">
          <ShoppingBag size={28} className="text-[#11ABC4]" /> Pedidos online
        </h1>
        <p className="text-gray-500 text-sm mt-1">{total} pedidos en total</p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Código</th>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Productos</th>
                <th className="px-4 py-3 text-left">Pago</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-left">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{o.code}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{o.user.name}</p>
                    <p className="text-xs text-gray-400">{o.user.email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(o.createdAt).toLocaleDateString("es-PE")}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{o.items.length} ítem(s)</td>
                  <td className="px-4 py-3">
                    <span className="badge bg-gray-100 text-gray-600">{o.paymentMethod ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-[#11ABC4]">{formatPrice(o.total)}</td>
                  <td className="px-4 py-3">
                    <form action={async (fd: FormData) => {
                      "use server";
                      const status = fd.get("status") as "PENDIENTE" | "PAGADO" | "ENVIADO" | "ENTREGADO" | "CANCELADO";
                      await updateOrderStatus(o.id, status);
                    }}>
                      <select name="status" defaultValue={o.status} onChange={(e) => (e.target.form as HTMLFormElement).requestSubmit()} className={`text-xs font-semibold px-2 py-1 rounded-lg border-0 cursor-pointer ${STATUS_COLORS[o.status]}`}>
                        {["PENDIENTE","PAGADO","ENVIADO","ENTREGADO","CANCELADO"].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex justify-between items-center">
            <span className="text-sm text-gray-500">Página {sp.page ?? 1} de {pages}</span>
            <div className="flex gap-2">
              {Number(sp.page ?? 1) > 1 && <a href={`?page=${Number(sp.page ?? 1) - 1}`} className="btn-secondary text-sm px-3 py-1.5">Anterior</a>}
              {Number(sp.page ?? 1) < pages && <a href={`?page=${Number(sp.page ?? 1) + 1}`} className="btn-primary text-sm px-3 py-1.5">Siguiente</a>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
