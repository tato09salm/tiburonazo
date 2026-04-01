"use client";

import { useState } from "react";
import { createSale } from "@/actions/admin.actions";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { PAYMENT_METHODS } from "@/lib/constants";
import { PaymentMethod } from "@prisma/client";

interface Store { id: string; name: string }
interface SaleItem { variantId: string; quantity: number; price: number }

export function SaleForm({ stores }: { stores: Store[] }) {
  const router = useRouter();
  const [storeId, setStoreId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("EFECTIVO");
  const [destination, setDestination] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<SaleItem[]>([{ variantId: "", quantity: 1, price: 0 }]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  function updateItem(i: number, key: string, val: string | number) {
    setItems((it) => it.map((item, idx) => idx === i ? { ...item, [key]: val } : item));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validItems = items.filter((i) => i.variantId && i.quantity > 0 && i.price > 0);
    if (!storeId || !validItems.length) return;
    setLoading(true);
    try {
      await createSale({ storeId, paymentMethod, destination, notes, items: validItems.map((i) => ({ ...i, quantity: Number(i.quantity), price: Number(i.price) })) });
      setSuccess(true);
      setItems([{ variantId: "", quantity: 1, price: 0 }]);
      setNotes("");
      setDestination("");
      setTimeout(() => { setSuccess(false); router.refresh(); }, 1500);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Tienda *</label>
        <select value={storeId} onChange={(e) => setStoreId(e.target.value)} required className="input text-sm">
          <option value="">Seleccionar tienda...</option>
          {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Método de pago</label>
        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className="input text-sm">
          {PAYMENT_METHODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Cuenta de destino</label>
        <input value={destination} onChange={(e) => setDestination(e.target.value)} className="input text-sm" placeholder="Sr. Andree / Caja..." />
      </div>

      {/* Items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-semibold text-gray-600">Productos *</label>
          <button type="button" onClick={() => setItems((i) => [...i, { variantId: "", quantity: 1, price: 0 }])} className="text-[#11ABC4] text-xs flex items-center gap-1 hover:underline">
            <Plus size={12} /> Agregar
          </button>
        </div>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-7 gap-1 items-center">
              <input value={item.variantId} onChange={(e) => updateItem(i, "variantId", e.target.value)} placeholder="Variant ID" className="input text-xs col-span-3" />
              <input type="number" value={item.quantity} onChange={(e) => updateItem(i, "quantity", e.target.value)} placeholder="Cant." className="input text-xs col-span-1" min={1} />
              <input type="number" value={item.price || ""} onChange={(e) => updateItem(i, "price", e.target.value)} placeholder="S/." className="input text-xs col-span-2" min={0} step={0.01} />
              {items.length > 1 && (
                <button type="button" onClick={() => setItems((it) => it.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 flex justify-center">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between text-sm font-bold border-t pt-2">
        <span>Total:</span>
        <span className="text-[#11ABC4]">S/ {total.toFixed(2)}</span>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Nota</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input text-sm resize-none" rows={2} placeholder="Observaciones..." />
      </div>

      <button type="submit" disabled={loading} className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${success ? "bg-green-500 text-white" : "btn-primary"}`}>
        {loading ? <Loader2 size={16} className="animate-spin" /> : success ? "✓ Venta registrada" : "Registrar venta"}
      </button>
    </form>
  );
}
