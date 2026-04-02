import { getDashboardStats, getLowStockProducts } from "@/actions/admin.actions";
import { formatPrice } from "@/lib/utils";
import { Package, ShoppingBag, DollarSign, AlertTriangle, TrendingUp } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard - Admin" };

export default async function DashboardPage() {
  const [stats, lowStock] = await Promise.all([
    getDashboardStats(),
    getLowStockProducts(),
  ]);

  const cards = [
    { label: "Productos activos", value: stats.totalProducts, icon: Package, color: "bg-blue-50 text-blue-600" },
    { label: "Pedidos totales", value: stats.totalOrders, icon: ShoppingBag, color: "bg-purple-50 text-purple-600" },
    { label: "Ingresos totales", value: formatPrice(stats.totalRevenue), icon: DollarSign, color: "bg-green-50 text-green-600" },
    { label: "Stock bajo", value: stats.lowStockCount, icon: AlertTriangle, color: "bg-orange-50 text-orange-600" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Resumen general del negocio</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500 font-medium">{c.label}</p>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.color}`}>
                <c.icon size={20} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="card p-6">
          <h2 className="font-heading text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-[#11ABC4]" /> Ventas recientes
          </h2>
          {stats.recentSales.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No hay ventas aún</p>
          ) : (
            <div className="space-y-3">
              {stats.recentSales.slice(0, 6).map((sale) => (
                <div key={sale.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{sale.code}</p>
                    <p className="text-xs text-gray-400">{sale.store.name} · {sale.vendedor?.name ?? "—"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#11ABC4]">{formatPrice(sale.total)}</p>
                    <p className="text-xs text-gray-400">{sale.paymentMethod}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock */}
        <div className="card p-6">
          <h2 className="font-heading text-lg font-bold mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-orange-500" /> Stock bajo
          </h2>
          {lowStock.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Todo en buen nivel ✓</p>
          ) : (
            <div className="space-y-2">
              {lowStock.slice(0, 8).map((v) => (
                <div key={v.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{v.product.title}</p>
                    <p className="text-xs text-gray-400">{v.product.category.name} · {v.sku}</p>
                  </div>
                  <span className={`badge ${v.stock === 0 ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"}`}>
                    {v.stock} uds.
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
