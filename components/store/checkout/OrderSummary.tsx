import Image from "next/image";
import { ShieldCheck, ArrowRight, CreditCard, Loader2, Truck, Store } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export const OrderSummary = ({ items, total, shippingCost, isCalculating, step, paymentMethod, formId, deliveryMethod }: any) => {
  const finalTotal = total + (shippingCost || 0);

  return (
    <aside className="lg:col-span-1">
      <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 sticky top-24">
        <h2 className="text-lg font-bold mb-6">Resumen</h2>
        
        {/* Lista de productos... */}
        <div className="space-y-4 mb-6 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar border-b pb-4">
          {items.map((item: any) => (
            <div key={item.variantId} className="flex gap-4">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-50">
                <Image src={item.image} alt={item.title} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0 text-xs">
                <p className="font-bold truncate">{item.title}</p>
                <p className="font-black text-[#11ABC4]">{formatPrice(item.price * item.quantity)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex justify-between text-gray-500 text-sm font-medium">
            <span>Productos</span>
            <span>{formatPrice(total)}</span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="flex items-center gap-2 text-gray-500 font-medium">
              {deliveryMethod === "SHIPPING" ? <Truck size={14} /> : <Store size={14} />}
              Envío
            </span>
            {isCalculating ? (
              <Loader2 size={14} className="animate-spin text-[#11ABC4]" />
            ) : deliveryMethod === "PICKUP" ? (
              <span className="text-green-600 font-bold uppercase text-[10px] bg-green-50 px-2 py-0.5 rounded">Gratis</span>
            ) : shippingCost ? (
              <span className="font-bold text-gray-900">{formatPrice(shippingCost)}</span>
            ) : (
              <span className="text-[10px] text-amber-500 font-bold uppercase italic">Pendiente</span>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 mt-2 border-t">
            <span className="font-bold text-gray-900">Total</span>
            <span className="text-3xl font-black text-[#11ABC4] tracking-tighter">
              {formatPrice(finalTotal)}
            </span>
          </div>
        </div>

        {step === 1 ? (
          <button form={formId} type="submit" disabled={isCalculating} className="btn-primary w-full mt-6 py-4 rounded-2xl flex items-center justify-center gap-3">
            Continuar al pago <ArrowRight size={18} />
          </button>
        ) : (
          <div className="mt-6 p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Método de Pago</p>
            <p className="text-xs font-black flex items-center justify-center gap-2 uppercase">
              <CreditCard size={14} /> {paymentMethod.replace("_", " ")}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};