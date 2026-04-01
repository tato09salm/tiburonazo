"use client";

import { useState } from "react";
import { createInventoryMove } from "@/actions/admin.actions";
import { MoveType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface Store { id: string; name: string }

export function InventoryMoveForm({ stores }: { stores: Store[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ variantId: "", storeId: "", type: "ENTRADA" as MoveType, quantity: 1, reason: "", note: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const update = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.variantId || !form.storeId) return;
    setLoading(true);
    try {
      await createInventoryMove({ ...form, quantity: Number(form.quantity) });
      setSuccess(true);
      setForm((f) => ({ ...f, variantId: "", quantity: 1, reason: "", note: "" }));
      setTimeout(() => setSuccess(false), 2000);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">ID de variante *</label>
        <input value={form.variantId} onChange={update("variantId")} required className="input text-sm" placeholder="ID de la variante" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Tienda *</label>
        <select value={form.storeId} onChange={update("storeId")} required className="input text-sm">
          <option value="">Seleccionar tienda...</option>
          {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo</label>
          <select value={form.type} onChange={update("type")} className="input text-sm">
            <option value="ENTRADA">Entrada</option>
            <option value="SALIDA">Salida</option>
            <option value="AJUSTE">Ajuste</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Cantidad</label>
          <input type="number" value={form.quantity} onChange={update("quantity")} min={1} required className="input text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Motivo</label>
        <input value={form.reason} onChange={update("reason")} className="input text-sm" placeholder="INICIAL, VENTA, DAÑO..." />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Nota</label>
        <textarea value={form.note} onChange={update("note")} className="input text-sm resize-none" rows={2} placeholder="Observaciones..." />
      </div>
      <button type="submit" disabled={loading} className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${success ? "bg-green-500 text-white" : "btn-primary"}`}>
        {loading ? <Loader2 size={16} className="animate-spin" /> : success ? "✓ Registrado" : "Registrar movimiento"}
      </button>
    </form>
  );
}
