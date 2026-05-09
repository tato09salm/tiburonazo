// components/store/checkout/PaymentSection.tsx
"use client";

import { useState } from "react";
import { CreditCard, Smartphone, QrCode, ChevronLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createOrder } from "@/actions/order.actions";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";

export const PaymentSection = ({ formData, ubigeo, paymentMethod, setPaymentMethod, onBack, total, shippingCost, items }: any) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { clearCart } = useCart();
  const finalTotal = total + shippingCost;

  const methods = [
    { id: "CULQI", label: "Tarjeta de Crédito / Débito", icon: CreditCard, desc: "Visa, Mastercard, Diners" },
    { id: "YAPE", label: "Yape", icon: Smartphone, desc: "Pago con código Yape" },
    { id: "PAGO_EFECTIVO", label: "PagoEfectivo o QR", icon: QrCode, desc: "Código CIP o QR" },
  ];

  const handleOrder = async () => {
    setLoading(true);
    try {
      // Nota: Aquí se llamaría a Culqi.open() antes de createOrder si es tarjeta
      await createOrder({
        ...formData,
        ubigeo,
        paymentMethod,
        shippingCost,
        total: finalTotal,
        items: items.map((i: any) => ({ variantId: i.variantId, quantity: i.quantity, price: i.price }))
      });
      clearCart();
      router.push("/cuenta?success=1");
    } catch (error) {
      alert("Error al procesar pedido");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-gray-500">
        <ChevronLeft size={18} /> Editar datos de envío
      </button>

      <section className="bg-white p-6 rounded-2xl border shadow-sm">
        <h2 className="text-xl font-bold mb-6">Método de Pago</h2>
        <div className="grid grid-cols-1 gap-3">
          {methods.map((m) => (
            <label key={m.id} className={cn(
              "flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all",
              paymentMethod === m.id ? "border-[#11ABC4] bg-[#11ABC4]/5" : "border-gray-100"
            )}>
              <input type="radio" name="payment" className="sr-only" checked={paymentMethod === m.id} onChange={() => setPaymentMethod(m.id)} />
              <m.icon size={24} className={paymentMethod === m.id ? "text-[#11ABC4]" : "text-gray-400"} />
              <div className="flex-1">
                <p className="font-bold text-sm">{m.label}</p>
                <p className="text-xs text-gray-400">{m.desc}</p>
              </div>
            </label>
          ))}
        </div>

        <button 
          onClick={handleOrder}
          disabled={loading}
          className="btn-primary w-full mt-8 py-5 rounded-2xl flex items-center justify-center gap-3 text-lg"
        >
          {loading ? <Loader2 className="animate-spin" /> : <CreditCard size={20} />}
          {loading ? "Procesando..." : `Pagar ${finalTotal.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}`}
        </button>
      </section>
    </div>
  );
};