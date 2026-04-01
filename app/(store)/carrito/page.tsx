"use client";

import { useCart } from "@/hooks/useCart";
import { PriceDisplay } from "@/components/store/price-display";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react";

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();

  if (!items.length) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h1 className="section-title mb-3">Tu carrito está vacío</h1>
        <p className="text-gray-500 mb-8">Explora nuestra tienda y encuentra algo que te guste</p>
        <Link href="/productos" className="btn-primary inline-flex items-center gap-2">
          <ShoppingBag size={18} /> Ver productos
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/productos" className="text-gray-400 hover:text-[#11ABC4] transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="section-title">Carrito ({items.length} {items.length === 1 ? "producto" : "productos"})</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div key={item.variantId} className="card p-4 flex gap-4 items-start">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                <Image src={item.image} alt={item.title} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/productos/${item.slug}`} className="font-semibold text-sm hover:text-[#11ABC4] line-clamp-2">
                  {item.title}
                </Link>
                <div className="flex flex-wrap gap-2 mt-1">
                  {item.color && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{item.color}</span>}
                  {item.size && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Talla {item.size}</span>}
                  {item.model && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{item.model}</span>}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button onClick={() => updateQuantity(item.variantId, item.quantity - 1)} className="px-2 py-1.5 hover:bg-gray-50 text-gray-600">
                      <Minus size={14} />
                    </button>
                    <span className="px-3 text-sm font-bold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)} className="px-2 py-1.5 hover:bg-gray-50 text-gray-600" disabled={item.quantity >= item.stock}>
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[#11ABC4]">{formatPrice(item.price * item.quantity)}</span>
                    <button onClick={() => removeItem(item.variantId)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button onClick={clearCart} className="text-sm text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 mt-2">
            <Trash2 size={14} /> Vaciar carrito
          </button>
        </div>

        {/* Summary */}
        <div className="card p-6 h-fit sticky top-24 space-y-4">
          <h2 className="font-heading text-xl font-bold">Resumen del pedido</h2>

          <div className="space-y-2 text-sm">
            {items.map((item) => (
              <div key={item.variantId} className="flex justify-between text-gray-600">
                <span className="truncate max-w-[200px]">{item.title} x{item.quantity}</span>
                <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-[#11ABC4]">{formatPrice(total)}</span>
          </div>

          <p className="text-xs text-gray-400">* Envío calculado al confirmar el pedido</p>

          <Link href="/checkout" className="btn-primary w-full text-center block">
            Proceder al pago
          </Link>
          <Link href="/productos" className="btn-secondary w-full text-center block text-sm">
            Seguir comprando
          </Link>
        </div>
      </div>
    </div>
  );
}
