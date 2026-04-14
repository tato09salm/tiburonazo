"use client";

import { useEffect } from "react";
import { X, Package, AlertCircle, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

interface DetailModalProps {
  title?: string;
  items: any[];
  onClose: () => void;
}

export function DetailModal({ title, items, onClose }: DetailModalProps) {
  // Manejo de scroll y teclado
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* Backdrop con desenfoque profundo */}
      <div 
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Contenedor del Modal */}
      <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        
        {/* Header Optimizado: py-5 y mb-0.5 para reducir espacio vertical */}
        <div className="py-5 px-8 border-b border-gray-50 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">{title}</h3>
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              {items.length} productos encontrados
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 hover:bg-gray-100 rounded-2xl text-gray-400 hover:text-gray-900 transition-all active:scale-90"
          >
            <X size={22} />
          </button>
        </div>

        {/* Cuerpo: pt-3 para acercar la lista al header */}
        <div className="flex-1 overflow-y-auto pt-3 px-6 pb-6 space-y-3 custom-scrollbar bg-gray-50/30">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-300">
              <Package size={64} strokeWidth={1} className="mb-4 opacity-20" />
              <p className="text-sm font-bold italic tracking-tight">No hay datos disponibles</p>
            </div>
          ) : (
            items.map((item) => (
              <div 
                key={item.id} 
                className="group flex items-center justify-between p-4 rounded-3xl border border-white bg-white shadow-sm hover:shadow-md hover:border-[#11ABC4]/30 transition-all duration-300"
              >
                {/* Info Izquierda */}
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-inner",
                    item.stock === 0 ? "bg-red-50 text-red-400" : "bg-cyan-50 text-[#11ABC4]"
                  )}>
                    <Package size={20} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-black text-gray-800 text-[13px] group-hover:text-[#11ABC4] transition-colors leading-tight">
                      {item.product.title}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                        <Hash size={8} /> {item.sku}
                      </span>
                      {item.product.category && (
                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-tighter">
                          • {item.product.category.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Stock Derecha */}
                <div className="text-right flex flex-col items-end gap-1">
                  <div className={cn(
                    "px-3 py-1 rounded-xl font-black text-[12px] flex items-center gap-1.5 shadow-sm",
                    item.stock === 0 
                      ? "bg-red-500 text-white" 
                      : item.stock <= 5 
                      ? "bg-orange-100 text-orange-600" 
                      : "bg-gray-100 text-gray-700"
                  )}>
                    {item.stock === 0 && <AlertCircle size={12} />}
                    {item.stock} <span className="text-[9px] opacity-80 uppercase tracking-tighter">uds</span>
                  </div>
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest pr-1">
                    Stock Actual
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-5 bg-white border-t border-gray-50 flex justify-center">
          <button 
            onClick={onClose}
            className="px-10 py-3 rounded-2xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#11ABC4] transition-all active:scale-95 shadow-lg shadow-gray-200"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}