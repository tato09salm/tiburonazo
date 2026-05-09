"use client";

import { useState, useMemo } from "react";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function CartPage() {
  const { items, removeItem, updateQuantity } = useCart();
  const [selectedItems, setSelectedItems] = useState<string[]>(
    items.map((item) => item.variantId)
  );

  const selectedCount = useMemo(() => {
    return items
      .filter((item) => selectedItems.includes(item.variantId))
      .reduce((acc, item) => acc + item.quantity, 0);
  }, [items, selectedItems]);

  const selectedTotal = useMemo(() => {
    return items
      .filter((item) => selectedItems.includes(item.variantId))
      .reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [items, selectedItems]);

  const toggleSelect = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map((i) => i.variantId));
    }
  };

  const removeSelected = () => {
    selectedItems.forEach((id) => removeItem(id));
    setSelectedItems([]);
  };

  if (!items.length) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="text-7xl mb-6">🛒</div>
        <h1 className="text-3xl font-bold mb-3">Tu carrito está vacío</h1>
        <p className="text-gray-500 mb-8 text-lg">Parece que aún no has añadido nada a tu bolsa.</p>
        <Link href="/productos" className="btn-primary inline-flex items-center gap-2 px-8">
          <ShoppingBag size={20} /> Empezar a comprar
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

        <div className="lg:col-span-8">
          <div className="flex items-baseline gap-3 mb-10">
            <Link href="/productos" className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-3xl font-black uppercase tracking-tight">Mi Carrito</h1>
            <span className="text-sm font-bold text-gray-400">
              ({selectedCount} {selectedCount === 1 ? "producto" : "productos"})
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                onClick={toggleAll}
                className={cn(
                  "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all",
                  selectedItems.length === items.length && items.length > 0
                    ? "bg-[#11ABC4] border-[#11ABC4]"
                    : "border-gray-300 group-hover:border-[#11ABC4]"
                )}
              >
                {selectedItems.length === items.length && items.length > 0 && <Check size={16} className="text-white" />}
              </div>
              <span className="text-sm font-bold uppercase tracking-wider text-gray-700">
                Seleccionar todo
              </span>
            </label>

            {selectedItems.length > 0 && (
              <button
                onClick={removeSelected}
                className="text-sm font-bold text-red-500 hover:text-red-700 flex items-center gap-2 transition-colors"
              >
                <Trash2 size={16} /> Eliminar seleccionados
              </button>
            )}
          </div>

          {/* LISTA DE PRODUCTOS CON ANIMACION DE REORDENAMIENTO */}
          <div className="space-y-4 relative">
            <AnimatePresence mode="popLayout" initial={false}>
              {items.map((item) => {
                const isSelected = selectedItems.includes(item.variantId);
                return (
                  <motion.div
                    layout
                    key={item.variantId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    transition={{ type: "spring", stiffness: 500, damping: 40, mass: 1 }}
                    className={cn(
                      "relative bg-white p-5 rounded-3xl border transition-all flex gap-5 items-center",
                      isSelected ? "border-[#11ABC4]/30 shadow-md" : "border-gray-100 shadow-sm opacity-70"
                    )}
                  >
                    <div
                      onClick={() => toggleSelect(item.variantId)}
                      className={cn(
                        "w-6 h-6 rounded-md border-2 flex items-center justify-center cursor-pointer shrink-0 transition-all",
                        isSelected
                          ? "bg-[#11ABC4] border-[#11ABC4]"
                          : "border-gray-200 hover:border-[#11ABC4]"
                      )}
                    >
                      {isSelected && <Check size={16} className="text-white" />}
                    </div>

                    <div className="relative w-32 h-32 rounded-2xl overflow-hidden bg-gray-50 shrink-0 border border-gray-50">
                      <Image src={item.image} alt={item.title} fill className="object-cover" quality={100} />
                    </div>

                    <div className="flex-1 flex flex-col self-stretch py-1">
                      <div className="flex justify-between items-start">
                        <Link href={`/productos/${item.slug}`} className="font-bold text-lg hover:text-[#11ABC4] leading-tight line-clamp-1 pr-10 transition-colors">
                          {item.title}
                        </Link>
                        <button
                          onClick={() => removeItem(item.variantId)}
                          className="absolute top-5 right-5 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-2">
                        {item.color && <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50 px-2 py-1 rounded-md">{item.color}</span>}
                        {item.size && <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50 px-2 py-1 rounded-md">Talla {item.size}</span>}
                      </div>

                      <div className="mt-auto flex items-end justify-between">
                        <div className={cn(
                          "flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100 transition-all",
                          !isSelected && "opacity-90 grayscale pointer-events-none"
                        )}>
                          <button
                            disabled={!isSelected}
                            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-600 disabled:opacity-30"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-10 text-center text-sm font-black">{item.quantity}</span>
                          <button
                            disabled={!isSelected || item.quantity >= item.stock}
                            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-600 disabled:opacity-30"
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="text-xl font-black text-[#11ABC4]">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* COLUMNA DERECHA: RESUMEN (ESTÁTICO) */}
        <div className="lg:col-span-4 lg:sticky lg:top-36">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100  space-y-2">
            <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900 border-b border-gray-50 pb-4">
              Resumen del pedido
            </h2>

            <div className="space-y-4 max-h-[35vh] overflow-y-auto custom-scrollbar">
              {items.filter(i => selectedItems.includes(i.variantId)).map((item) => (
                <div key={item.variantId} className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium truncate max-w-[180px]">
                    {item.title} <b className="text-[#11ABC4]">x{item.quantity}</b>
                  </span>
                  <span className="text-gray-800 text-right min-w-[80px]">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
              {selectedItems.length === 0 && (
                <p className="text-xs text-center italic text-gray-400 py-4">Selecciona productos para continuar</p>
              )}
            </div>

            <div className="pt-6 border-t border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-gray-900 text-sm uppercase tracking-wider">Total</span>
                <span className="font-bold text-gray-900 text-sm text-right min-w-[80px]">
                  {formatPrice(selectedTotal)}
                </span>
              </div>

              <div className="space-y-3">
                <Link
                  href={selectedItems.length > 0 ? "/checkout" : "#"}
                  className={cn(
                    "w-full h-16 flex items-center justify-center gap-3 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl",
                    selectedItems.length > 0
                      ? "bg-[#11ABC4] text-white hover:bg-[#0d8fa6] active:scale-[0.98] shadow-[#11ABC4]/20"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                  )}
                >
                  Procesar Compra <ArrowLeft size={20} className="rotate-180" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}