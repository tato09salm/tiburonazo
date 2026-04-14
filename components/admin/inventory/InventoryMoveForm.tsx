"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ArrowDown, ArrowUp, Hash, Trash2, Package, FileText } from "lucide-react";

import { inventorySchema, type InventoryFormValues } from "@/lib/validations/inventory.schema"; 
import { createInventoryMove } from "@/actions/admin.actions";
import { ProductSearch } from "./ProductSearch";
import { cn } from "@/lib/utils";

const REASONS = {
  ENTRADA: ["AJUSTE_POSITIVO", "DEVOLUCION_CLIENTE", "REABASTECIMIENTO"],
  SALIDA: ["AJUSTE_NEGATIVO", "MERMA_DAÑO", "PERDIDA_ROBO", "USO_INTERNO"],
};

type InventoryFormWithUI = InventoryFormValues & {
  items: Array<{
    variantId: string;
    quantity: number;
    name?: string; // Campo opcional para la UI
    sku?: string;  // Campo opcional para la UI
  }>;
};

export function InventoryMoveForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [searchKey, setSearchKey] = useState(0);

  const { register, control, handleSubmit, setValue, watch, formState: { errors } } = useForm<InventoryFormWithUI>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      type: "ENTRADA",
      reason: "",
      note: "",
      items: []
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const selectedType = watch("type");
  const itemsInList = watch("items");

  async function onSubmit(data: InventoryFormValues) {
    if (data.items.length === 0) {
      toast.error("Añade al menos un producto");
      return;
    }

    setLoading(true);
    try {
      await createInventoryMove(data);
      toast.success("Inventario actualizado", { position: "top-right" });
      router.refresh();
      onSuccess?.(); 
    } catch (err: any) {
      toast.error(err.message || "Error al procesar");
    } finally {
      setLoading(false);
    }
  }

  const handleProductSelect = (product: any) => {
    const exists = itemsInList.find(item => item.variantId === product.id);
    if (exists) {
      toast.info("El producto ya está en la lista");
      return;
    }

    append({ 
      variantId: product.id, 
      quantity: 1,
      name: product.product?.title || "Producto",
      sku: product.sku || "Sin SKU"
    });

    setSearchKey(prev => prev + 1);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-4 pb-2">
      
      {/* SECCIÓN SUPERIOR: TIPO Y MOTIVO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
        <div className="flex gap-2">
          {(["ENTRADA", "SALIDA"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setValue("type", t); setValue("reason", ""); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border transition-all font-black text-[10px] tracking-tight",
                selectedType === t 
                  ? (t === "ENTRADA" ? "border-green-500 bg-white text-green-600 shadow-sm" : "border-red-500 bg-white text-red-600 shadow-sm")
                  : "border-transparent text-gray-400 opacity-60 hover:opacity-100"
              )}
            >
              {t === "ENTRADA" ? <ArrowDown size={14} /> : <ArrowUp size={14} />} {t}
            </button>
          ))}
        </div>

        <select 
          {...register("reason")}
          className="h-10 px-3 rounded-xl bg-white border border-gray-200 text-[11px] font-bold focus:ring-2 focus:ring-[#11ABC4]/10 appearance-none"
        >
          <option value="">Seleccionar motivo...</option>
          {REASONS[selectedType].map(r => (
            <option key={r} value={r}>{r.replace("_", " ")}</option>
          ))}
        </select>
      </div>

      {/* BUSCADOR */}
      <div className="px-1">
        <ProductSearch key={searchKey} onSelect={handleProductSelect} />
      </div>

      {/* LISTA DE PRODUCTOS */}
      <div className="space-y-2 px-1">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Productos en cola: {fields.length}
          </span>
          {errors.items && <span className="text-[9px] text-red-500 font-bold uppercase">Selección requerida</span>}
        </div>
        
        <div className="max-h-[240px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {fields.length === 0 ? (
            <div className="text-center py-10 text-[11px] text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/30">
              Usa el buscador para añadir items...
            </div>
          ) : (
            fields.map((field: any, index) => (
              <div key={field.id} className="flex items-center gap-4 p-3 bg-white border border-gray-100 rounded-xl shadow-sm animate-in fade-in zoom-in-95 duration-200">
                <div className="flex-1 min-w-0">
                  <h4 className="text-[11px] font-black text-gray-800 truncate">
                    {field.name}
                  </h4>
                  <p className="text-[9px] text-[#11ABC4] font-mono font-bold uppercase tracking-tighter">
                    SKU: {field.sku}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-20 relative">
                    <Hash className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-300" size={10} />
                    <input
                      type="number"
                      {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                      className="w-full h-8 pl-6 pr-2 rounded-lg bg-gray-50 border-none text-[11px] font-black focus:ring-2 focus:ring-[#11ABC4]/20"
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => remove(index)} 
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* NOTAS Y ACCIÓN */}
      <div className="space-y-4 pt-4 border-t border-gray-100 px-1">
        <div className="relative">
          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input 
            {...register("note")}
            placeholder="Notas u observaciones (opcional)..."
            className="w-full pl-10 h-10 rounded-xl bg-gray-50 border-none text-[11px] focus:ring-2 focus:ring-[#11ABC4]/10 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading || fields.length === 0}
          className={cn(
            "w-full h-12 rounded-xl font-black text-[11px] tracking-[0.15em] transition-all flex items-center justify-center gap-2 shadow-xl shadow-gray-200",
            fields.length === 0 
              ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
              : "bg-[#1a1a2e] text-white hover:bg-[#11ABC4] active:scale-[0.98]"
          )}
        >
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <><Package size={16} /> CONFIRMAR CARGA </>
          )}
        </button>
      </div>
    </form>
  );
}