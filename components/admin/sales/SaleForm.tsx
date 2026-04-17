"use client";

import { useState, useEffect, useRef } from "react";
import { createSale, searchProductVariants } from "@/actions/admin.actions";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, Search, X, BarChart3, ShoppingBag } from "lucide-react";
import { PAYMENT_METHODS } from "@/lib/constants";
import { PaymentMethod } from "@prisma/client";
import { cn } from "@/lib/utils";

interface Store { id: string; name: string }
interface Vendedor { id: string; name: string }
interface SaleItem { 
  variantId: string; 
  quantity: number; 
  price: number;
  oldPrice?: number | null;
  productTitle?: string;
  sku?: string;
  colorName?: string;
  sizeLabel?: string;
  imageUrl?: string;
  stock: number;
}

export function SaleForm({ stores, vendedores, currentUserId }: { stores: Store[], vendedores: Vendedor[], currentUserId?: string }) {
  const router = useRouter();
  const [storeId, setStoreId] = useState("");
  const [vendedorId, setVendedorId] = useState(currentUserId || "");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("EFECTIVO");
  const [destination, setDestination] = useState("");
  const [destinationHistory, setDestinationHistory] = useState<string[]>([]);
  const [showDestinationHistory, setShowDestinationHistory] = useState(false);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const quantityRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Alert Modal state
  const [alertModal, setAlertModal] = useState<{ open: boolean; title: string; message: string; type: 'warning' | 'error'; duplicateId?: string }>({
    open: false,
    title: "",
    message: "",
    type: 'warning'
  });

  // Search state (global)
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const sagrado = stores.find(s => s.name.toUpperCase() === "SAGRADO CORAZÓN");
    if (sagrado) setStoreId(sagrado.id);

    // Cargar historial de destinos
    const history = localStorage.getItem("destination_history");
    if (history) {
      setDestinationHistory(JSON.parse(history));
    }
  }, [stores]);

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  
  // Lógica de redondeo para Perú (Efectivo a favor del cliente: 1.57 -> 1.50)
  const total = paymentMethod === "EFECTIVO" 
    ? Math.floor(subtotal * 10) / 10 
    : subtotal;

  async function handleSearch(query: string) {
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const results = await searchProductVariants(query);
    setSearchResults(results);
    setShowResults(true);
  }

  function selectVariant(variant: any) {
    const existingItemIndex = items.findIndex(i => i.variantId === variant.id);
    
    if (existingItemIndex !== -1) {
      // Mover el item existente a la parte superior (pila)
      setItems((prev) => {
        const newItems = [...prev];
        const [duplicateItem] = newItems.splice(existingItemIndex, 1);
        return [duplicateItem, ...newItems];
      });

      setAlertModal({
        open: true,
        title: "Producto Duplicado",
        message: "Este producto ya ha sido agregado a la venta. Se ha movido a la parte superior.",
        type: 'warning',
        duplicateId: variant.id
      });
      
      // Limpiar buscador
      setSearchQuery("");
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    if (variant.stock <= 0) {
      setAlertModal({
        open: true,
        title: "Sin Stock",
        message: "Este producto no tiene stock disponible en este momento.",
        type: 'error'
      });
      return;
    }

    const variantImage = variant.product.images.find((img: any) => img.colorId === variant.colorId) || variant.product.images[0];
    
    const newItem: SaleItem = {
      variantId: variant.id,
      quantity: 1,
      price: variant.price,
      oldPrice: variant.oldPrice,
      productTitle: variant.product.title,
      sku: variant.sku,
      colorName: variant.color?.name,
      sizeLabel: variant.size?.label,
      imageUrl: variantImage?.url,
      stock: variant.stock,
    };

    // Agregar como una pila (LIFO) - al inicio del array
    setItems((prev) => [newItem, ...prev]);
    
    // Limpiar buscador
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  }

  function updateItem(i: number, key: string, val: string | number) {
    setItems((it) => it.map((item, idx) => {
      if (idx !== i) return item;
      
      let finalVal = val;
      if (key === "quantity") {
        const numVal = Number(val);
        if (numVal > item.stock) {
          setAlertModal({
            open: true,
            title: "Stock Insuficiente",
            message: `La cantidad no puede superar el stock disponible (${item.stock}).`,
            type: 'warning'
          });
          finalVal = item.stock;
        } else if (numVal < 1) {
          finalVal = 1;
        }
      }
      
      return { ...item, [key]: finalVal };
    }));
  }

  function addItem() {
    // Ya no se usa para agregar vacíos, ahora se usa el buscador global
  }

  function removeItem(idx: number) {
    setItems((it) => it.filter((_, i) => i !== idx));
  }

  function removeFromHistory(item: string) {
    const newHistory = destinationHistory.filter(h => h !== item);
    setDestinationHistory(newHistory);
    localStorage.setItem("destination_history", JSON.stringify(newHistory));
  }

  function clearItems() {
    setItems([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validItems = items.filter((i) => i.variantId && i.quantity > 0 && i.price > 0);
    if (!storeId || !destination || !validItems.length) return;
    setShowConfirmModal(true);
  }

  async function processSale() {
    const validItems = items.filter((i) => i.variantId && i.quantity > 0 && i.price > 0);
    setShowConfirmModal(false);
    setLoading(true);
    try {
      await createSale({ 
        storeId, 
        vendedorId: vendedorId || undefined,
        date,
        paymentMethod, 
        destination, 
        notes, 
        items: validItems.map((i) => ({ ...i, quantity: Number(i.quantity), price: Number(i.price) })) 
      });

      // Guardar en historial de destinos
      if (destination.trim()) {
        const newHistory = [
          destination.trim(),
          ...destinationHistory.filter(h => h.toLowerCase() !== destination.trim().toLowerCase())
        ].slice(0, 5); // Guardar solo los últimos 5
        setDestinationHistory(newHistory);
        localStorage.setItem("destination_history", JSON.stringify(newHistory));
      }

      setSuccess(true);
      setItems([]);
      setSearchQuery("");
      setNotes("");
      setDestination("");
      setTimeout(() => { 
        setSuccess(false); 
        router.push("/admin/sales");
        router.refresh(); 
      }, 1500);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* Columna 1: Datos de Venta */}
      <div className="card p-6 space-y-4 shadow-sm border-gray-100">
        <h2 className="font-heading text-lg font-bold flex items-center gap-2 border-b pb-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#CCECFB] text-[#11ABC4] flex items-center justify-center">
            <BarChart3 size={18} />
          </div>
          Datos de la Venta
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Tienda *</label>
            <div className="input text-sm bg-gray-50 flex items-center h-11 px-3 font-semibold text-gray-700">
              SAGRADO CORAZÓN
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Fecha</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              className="input text-sm h-11" 
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Método de pago *</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} required className="input text-sm h-11">
              {PAYMENT_METHODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Vendedor *</label>
            <select 
              value={vendedorId} 
              onChange={(e) => setVendedorId(e.target.value)} 
              required 
              disabled
              className="input text-sm h-11 bg-gray-100 cursor-not-allowed"
            >
              <option value="">Seleccionar...</option>
              {vendedores.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
        </div>

        <div className="relative">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Cuenta de destino *</label>
          <input 
            value={destination} 
            onChange={(e) => setDestination(e.target.value)} 
            onFocus={() => setShowDestinationHistory(true)}
            required 
            className="input text-sm h-11" 
            placeholder="Sr. Andree / Caja..." 
          />
          
          {showDestinationHistory && destinationHistory.length > 0 && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowDestinationHistory(false)} />
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-20 overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                  Historial reciente
                </div>
                {destinationHistory.map((h, i) => (
                  <div key={i} className="flex items-center group/item hover:bg-[#CCECFB] border-b border-gray-50 last:border-0">
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setDestination(h);
                        setShowDestinationHistory(false);
                      }}
                      className="flex-1 text-left px-3 py-2.5 text-xs transition-colors flex items-center gap-2 group"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-[#11ABC4]" />
                      {h}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeFromHistory(h);
                      }}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all rounded-lg mr-1"
                      title="Eliminar del historial"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Notas / Observaciones</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input text-xs resize-none p-3" rows={4} placeholder="Escribe aquí observaciones adicionales..." />
        </div>
      </div>

      {/* Columna 2: Productos */}
      <div className="card p-6 space-y-4 shadow-sm border-gray-100 flex flex-col h-full">
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <h2 className="font-heading text-lg font-bold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#CCECFB] text-[#11ABC4] flex items-center justify-center">
              <ShoppingBag size={18} />
            </div>
            Productos
          </h2>
        </div>

        {/* Buscador Global */}
        <div className="relative mb-6">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              value={searchQuery} 
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                }
              }}
              onFocus={() => {
                if (searchResults.length > 0) setShowResults(true);
              }}
              placeholder="Nombre, código o SKU..." 
              className="input pl-12 h-12 text-sm bg-gray-50 border-gray-200 focus:bg-white transition-all rounded-2xl" 
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                  setShowResults(false);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {showResults && searchResults.length > 0 && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowResults(false)} />
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-80 overflow-y-auto custom-scrollbar">
                {searchResults.map((v: any) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => selectVariant(v)}
                    className="w-full text-left px-4 py-3 hover:bg-[#CCECFB] border-b border-gray-50 last:border-0 flex items-center gap-4 transition-colors"
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 relative border border-gray-200">
                      {(() => {
                        const variantImage = v.product.images.find((img: any) => img.colorId === v.colorId) || v.product.images[0];
                        return variantImage ? (
                          <img src={variantImage.url} alt={v.product.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <ShoppingBag size={18} />
                          </div>
                        );
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 text-sm truncate">{v.product.title}</div>
                      <div className="flex gap-3 text-[11px] text-gray-500 mt-1 items-center">
                        <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded truncate">{v.sku}</span>
                        {v.color && <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: v.color.hex || '#eee' }} /> {v.color.name}</span>}
                        {v.size && <span className="bg-gray-100 px-1.5 py-0.5 rounded">Talla: {v.size.label}</span>}
                        <span className="text-[#11ABC4] font-bold text-xs ml-auto">S/ {v.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        
        <div className="space-y-4 flex-grow overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 border-2 border-dashed border-gray-100 rounded-3xl">
              <ShoppingBag size={48} className="mb-4 opacity-20" />
              <p className="text-sm font-medium">Usa el buscador para agregar productos</p>
            </div>
          ) : (
            items.map((item, i) => (
              <div key={i} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative group">
                <div className="flex gap-4">
                  {/* Imagen */}
                  <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productTitle} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <ShoppingBag size={24} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="font-bold text-gray-900 text-sm truncate">{item.productTitle}</div>
                      <div className="flex gap-2 text-[10px] text-gray-500 mt-1">
                        <span className="font-mono bg-gray-50 px-1.5 rounded">{item.sku}</span>
                        {item.colorName && <span>{item.colorName}</span>}
                        {item.sizeLabel && <span>Talla: {item.sizeLabel}</span>}
                        <span className="text-[#11ABC4] font-bold">Stock: {item.stock}</span>
                      </div>
                    </div>

                    <div className="flex gap-3 items-end mt-3">
                      <div className="flex-1">
                        {item.oldPrice ? (
                          <label className="block text-[10px] font-bold text-red-500 uppercase mb-1">Oferta</label>
                        ) : (
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Precio Base</label>
                        )}
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">S/</span>
                          <input 
                            type="number" 
                            value={item.price || ""} 
                            onChange={(e) => updateItem(i, "price", e.target.value)} 
                            className="input h-10 pl-8 text-xs font-bold text-gray-700" 
                            min={0} 
                            step={0.01} 
                          />
                        </div>
                      </div>
                      <div className="w-20">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Cant.</label>
                        <input 
                          ref={(el) => { quantityRefs.current[item.variantId] = el; }}
                          type="number" 
                          value={item.quantity} 
                          onChange={(e) => updateItem(i, "quantity", e.target.value)} 
                          className="input h-10 text-xs font-bold text-center" 
                          min={1} 
                          max={item.stock}
                        />
                      </div>
                      <div className="w-28">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Subtotal</label>
                        <div className="h-10 flex items-center justify-end px-4 bg-[#CCECFB]/30 border border-[#CCECFB] rounded-xl text-sm font-black text-[#11ABC4]">
                          S/ {(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeItem(i)} 
                        className="p-2.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="flex justify-end mt-4">
            <button 
              type="button" 
              onClick={clearItems} 
              className="text-stone-100 hover:text-stone-200 text-xs font-bold flex items-center justify-center gap-2 transition-all px-5 py-2.5 bg-red-500 rounded-xl shadow-sm hover:shadow-md active:scale-95"
            >
              <Trash2 size={14} /> Limpiar productos
            </button>
          </div>
        )}

        <div className="mt-auto pt-2 space-y-4">
          {paymentMethod === "EFECTIVO" && subtotal !== total && (
            <div className="px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl flex justify-between items-center text-[10px] font-bold text-amber-600 uppercase tracking-tight">
              <span>Subtotal real: S/ {subtotal.toFixed(2)}</span>
              <span>Redondeo a favor: - S/ {(subtotal - total).toFixed(2)}</span>
            </div>
          )}
          <div className="p-4 bg-[#CCECFB] rounded-2xl flex justify-between items-center shadow-inner">
            <span className="text-sm font-bold text-[#11ABC4] uppercase tracking-wider">
              {paymentMethod === "EFECTIVO" ? "Total (Efectivo)" : "Total Final"}
            </span>
            <span className="text-3xl font-black text-[#11ABC4]">S/ {total.toFixed(2)}</span>
          </div>

          <button type="submit" disabled={loading || items.some(i => !i.variantId)} className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all shadow-lg ${success ? "bg-green-500 text-white" : "btn-primary hover:scale-[1.02] active:scale-[0.98]"}`}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : success ? "✓ VENTA COMPLETADA" : "CONFIRMAR VENTA"}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-[#CCECFB] text-[#11ABC4] rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <ShoppingBag size={40} />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-3">¿Confirmar venta?</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-2">
                ¿Estás seguro de que deseas procesar esta venta por un total de:
              </p>
              <div className="text-2xl font-black text-[#11ABC4] bg-[#CCECFB]/30 py-2 rounded-2xl mb-4">
                S/ {total.toFixed(2)}
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Se descontará el stock de los productos
              </p>
            </div>
            <div className="bg-gray-50 px-8 py-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 h-12 text-sm font-bold text-gray-500 bg-white border border-gray-200 rounded-2xl hover:bg-gray-100 transition-all active:scale-95"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={processSale}
                className="flex-1 h-12 text-sm font-bold text-white bg-[#11ABC4] hover:bg-[#0E8A9E] rounded-2xl shadow-lg shadow-[#11ABC4]/20 transition-all active:scale-95"
              >
                Sí, confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
                alertModal.type === 'error' ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-500"
              )}>
                {alertModal.type === 'error' ? <X size={32} /> : <Search size={32} />}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{alertModal.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {alertModal.message}
              </p>
            </div>
            <div className="bg-gray-50 px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  const dupId = alertModal.duplicateId;
                  setAlertModal(prev => ({ ...prev, open: false }));
                  if (dupId) {
                    setTimeout(() => {
                      quantityRefs.current[dupId]?.focus();
                      quantityRefs.current[dupId]?.select();
                    }, 100);
                  }
                }}
                className={cn(
                  "w-full h-11 text-sm font-bold rounded-xl transition-all active:scale-95",
                  alertModal.type === 'error' 
                    ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200" 
                    : "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200"
                )}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

