import { auth } from "@/lib/auth";
import { getMyOrders } from "@/actions/order.actions";
import { redirect } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, User, CheckCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mi cuenta" };

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDIENTE:  { label: "Pendiente",  color: "bg-yellow-100 text-yellow-700" },
  PAGADO:     { label: "Pagado",     color: "bg-blue-100 text-blue-700" },
  ENVIADO:    { label: "Enviado",    color: "bg-purple-100 text-purple-700" },
  ENTREGADO:  { label: "Entregado",  color: "bg-green-100 text-green-700" },
  CANCELADO:  { label: "Cancelado",  color: "bg-red-100 text-red-500" },
};

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ success?: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");

  const sp = await searchParams;
  const orders = await getMyOrders();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {sp.success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-5 py-4 rounded-2xl flex items-center gap-3">
          <CheckCircle size={20} />
          <div>
            <p className="font-semibold">¡Pedido confirmado!</p>
            <p className="text-sm">Te contactaremos pronto para coordinar la entrega.</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-[#CCECFB] flex items-center justify-center text-[#11ABC4]">
          <User size={28} />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">{session.user?.name}</h1>
          <p className="text-gray-500 text-sm">{session.user?.email}</p>
        </div>
      </div>

      <div>
        <h2 className="font-heading text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <ShoppingBag size={20} className="text-[#11ABC4]" />
          Mis pedidos ({orders.length})
        </h2>

        {orders.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-gray-500 mb-4">Aún no tienes pedidos</p>
            <Link href="/productos" className="btn-primary inline-block">Empezar a comprar</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = STATUS_LABELS[order.status] ?? STATUS_LABELS.PENDIENTE;
              return (
                <div key={order.id} className="card p-5">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <div>
                      <span className="font-mono text-xs text-gray-400">{order.code}</span>
                      <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" })}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`badge ${status.color}`}>{status.label}</span>
                      <span className="font-bold text-[#11ABC4]">{formatPrice(order.total)}</span>
                    </div>
                  </div>

                  <div className="flex gap-3 flex-wrap">
                    {order.items.map((item) => (
                      <Link key={item.id} href={`/productos/${item.variant.product.images[0] ? item.variant.product.images[0].url : "#"}`} className="flex items-center gap-2 bg-gray-50 rounded-xl p-2 hover:bg-[#CCECFB] transition-colors">
                        {item.variant.product.images[0] && (
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                            <Image src={item.variant.product.images[0].url} alt={item.variant.product.title} fill className="object-cover" />
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-semibold line-clamp-1 max-w-[140px]">{item.variant.product.title}</p>
                          <p className="text-xs text-gray-400">
                            {[item.variant.size && `T.${item.variant.size}`, `x${item.quantity}`].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
