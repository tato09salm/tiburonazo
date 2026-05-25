import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    PENDIENTE: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700" },
    PAGADO: { label: "Pagado", color: "bg-blue-100 text-blue-700" },
    ENVIADO: { label: "Enviado", color: "bg-purple-100 text-purple-700" },
    ENTREGADO: { label: "Entregado", color: "bg-green-100 text-green-700" },
    CANCELADO: { label: "Cancelado", color: "bg-red-100 text-red-500" },
};

interface Props {
    orders: any[];
}

export function OrdersView({ orders }: Props) {
    if (orders.length === 0) {
        return (
            <div className="card p-12 text-center bg-white border border-gray-100 shadow-sm rounded-3xl">
                <p className="text-4xl mb-3">📦</p>
                <p className="text-gray-500 mb-4 font-medium">Aún no tienes pedidos registrados</p>
                <Link href="/productos" className="btn-primary inline-block text-xs font-bold px-6 py-2.5 rounded-xl">
                    Empezar a comprar
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {orders.map((order) => {
                const status = STATUS_LABELS[order.status] ?? STATUS_LABELS.PENDIENTE;
                return (
                    <div key={order.id} className="card p-5 bg-white border border-gray-100 shadow-sm rounded-3xl hover:shadow-md/50 transition-all">
                        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                            <div>
                                <span className="font-mono text-xs text-gray-400 font-bold">{order.code}</span>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {new Date(order.createdAt).toLocaleDateString("es-PE", {
                                        day: "2-digit",
                                        month: "long",
                                        year: "numeric"
                                    })}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide ${status.color}`}>
                                    {status.label}
                                </span>
                                <span className="font-bold text-[#11ABC4] text-base">{formatPrice(order.total)}</span>
                            </div>
                        </div>

                        <div className="flex gap-3 flex-wrap">
                            {order.items.map((item: any) => (
                                <Link
                                    key={item.id}
                                    href={`/productos/${item.variant.product.images[0] ? item.variant.product.images[0].url : "#"}`}
                                    className="flex items-center gap-2 bg-gray-50/80 rounded-xl p-2 hover:bg-[#CCECFB]/40 border border-gray-100 transition-colors"
                                >
                                    {item.variant.product.images[0] && (
                                        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-white shadow-sm">
                                            <Image src={item.variant.product.images[0].url} alt={item.variant.product.title} fill className="object-cover" />
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-xs font-bold text-gray-800 line-clamp-1 max-w-[140px]">{item.variant.product.title}</p>
                                        <p className="text-[10px] font-medium text-gray-400 mt-0.5">
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
    );
}