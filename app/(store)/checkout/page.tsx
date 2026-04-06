"use client";

import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";
import { createOrder } from "@/actions/order.actions";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ShieldCheck, Loader2, CreditCard, Smartphone, Banknote } from "lucide-react";
import Image from "next/image";

declare global {
  interface Window {
    Culqi: {
      publicKey: string;
      settings: (opts: object) => void;
      open: () => void;
      close: () => void;
      token?: { id: string };
    };
  }
}

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const { data: session } = useSession();
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<"CULQI" | "YAPE" | "EFECTIVO" | "TRANSFERENCIA">("CULQI");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!items.length) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <p className="text-5xl mb-4">🛒</p>
        <h1 className="section-title mb-4">Carrito vacío</h1>
        <Link href="/productos" className="btn-primary inline-block">Ver productos</Link>
      </div>
    );
  }

  async function handleOrder(culqiChargeId?: string) {
    setLoading(true);
    setError("");
    try {
      await createOrder({
        paymentMethod: paymentMethod as never,
        address,
        notes,
        culqiChargeId,
        items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity, price: i.price })),
      });
      clearCart();
      router.push("/cuenta?success=1");
    } catch (e) {
      setError("Error al procesar el pedido. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (paymentMethod === "CULQI") {
      // Load Culqi script dynamically
      if (!window.Culqi) {
        const script = document.createElement("script");
        script.src = "https://checkout.culqi.com/js/v4";
        script.onload = () => openCulqi();
        document.head.appendChild(script);
      } else {
        openCulqi();
      }
    } else {
      await handleOrder();
    }
  }

  function openCulqi() {
    window.Culqi.publicKey = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY ?? "";
    window.Culqi.settings({
      title: "Tiburonazo",
      currency: "PEN",
      description: `Pedido Tiburonazo (${items.length} producto${items.length > 1 ? "s" : ""})`,
      amount: Math.round(total * 100),
      order: `TIB-${Date.now()}`,
    });
    window.Culqi.open();

    const checkToken = setInterval(async () => {
      if (window.Culqi.token) {
        clearInterval(checkToken);
        const token = window.Culqi.token.id;
        window.Culqi.close();
        // Charge via API
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, amount: total, email: session?.user?.email, description: "Pedido Tiburonazo" }),
        });
        const data = await res.json();
        if (data.chargeId) {
          await handleOrder(data.chargeId);
        } else {
          setError(data.error ?? "Error en el pago");
          setLoading(false);
        }
      }
    }, 500);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="section-title mb-8">Finalizar compra</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: payment + address */}
          <div className="lg:col-span-2 space-y-5">
            {/* Payment method */}
            <div className="card p-6">
              <h2 className="font-heading text-lg font-bold mb-4">Método de pago</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "CULQI", label: "Tarjeta", icon: CreditCard, desc: "Visa / Mastercard" },
                  { value: "YAPE", label: "Yape / Plin", icon: Smartphone, desc: "Pago móvil" },
                  { value: "TRANSFERENCIA", label: "Transferencia", icon: Banknote, desc: "Banco" },
                  { value: "EFECTIVO", label: "Efectivo", icon: Banknote, desc: "Contra entrega" },
                ].map((pm) => (
                  <label
                    key={pm.value}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMethod === pm.value
                        ? "border-[#11ABC4] bg-[#CCECFB]"
                        : "border-gray-100 hover:border-[#11ABC4]/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={pm.value}
                      checked={paymentMethod === pm.value}
                      onChange={() => setPaymentMethod(pm.value as typeof paymentMethod)}
                      className="sr-only"
                    />
                    <pm.icon size={20} className={paymentMethod === pm.value ? "text-[#11ABC4]" : "text-gray-400"} />
                    <div>
                      <p className="text-sm font-semibold">{pm.label}</p>
                      <p className="text-xs text-gray-400">{pm.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Shipping */}
            <div className="card p-6">
              <h2 className="font-heading text-lg font-bold mb-4">Datos de envío</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Dirección de entrega</label>
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="input"
                    placeholder="Av. ejemplo 123, Trujillo..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Notas adicionales</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="input resize-none"
                    rows={3}
                    placeholder="Instrucciones de entrega, referencia..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: order summary */}
          <div className="space-y-4">
            <div className="card p-6 sticky top-24">
              <h2 className="font-heading text-lg font-bold mb-4">Resumen</h2>
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.variantId} className="flex gap-3 items-center">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                      <Image src={item.image} alt={item.title} fill className="object-cover" quality={100} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold line-clamp-1">{item.title}</p>
                      <p className="text-xs text-gray-400">
                        {[item.color, item.size && `T.${item.size}`].filter(Boolean).join(" · ")} x{item.quantity}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-[#11ABC4]">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-1 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span><span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Envío</span><span className="text-green-600">A confirmar</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-1 border-t border-gray-100">
                  <span>Total</span>
                  <span className="text-[#11ABC4]">{formatPrice(total)}</span>
                </div>
              </div>

              {error && (
                <div className="mt-3 bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-4 flex items-center justify-center gap-2 py-3"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <ShieldCheck size={18} />
                )}
                {loading ? "Procesando..." : paymentMethod === "CULQI" ? "Pagar con tarjeta" : "Confirmar pedido"}
              </button>

              <div className="flex items-center justify-center gap-2 mt-3 text-xs text-gray-400">
                <ShieldCheck size={13} />
                Compra 100% segura
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
