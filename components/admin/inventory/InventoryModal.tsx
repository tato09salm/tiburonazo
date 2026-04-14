"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { InventoryMoveForm } from "./InventoryMoveForm";

interface InventoryModalProps {
  children: React.ReactNode;
}

export function InventoryModal({ children }: InventoryModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const closeModal = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, closeModal]);

  if (!mounted) return null;

  return (
    <>
      <div onClick={() => setIsOpen(true)} className="inline-block cursor-pointer">
        {children}
      </div>

      {isOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop con Blur */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300"
            onClick={closeModal}
          />
          
          {/* Contenedor del Modal */}
          <div className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-[0_32px_64px_-15px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 ease-out">
            
            {/* Header Pro */}
            <div className="flex items-center justify-between p-8 pb-4 bg-white">
              <div>
                <span className="text-[10px] font-black text-[#11ABC4] uppercase tracking-[0.2em]">Logística Interna</span>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Gestión de Stock</h3>
              </div>
              <button 
                onClick={closeModal}
                className="group p-3 hover:bg-red-50 rounded-2xl transition-all active:scale-90"
              >
                <X size={24} className="text-gray-400 group-hover:text-red-500 transition-colors" />
              </button>
            </div>
            
            <div className="p-8 pt-2 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <InventoryMoveForm onSuccess={closeModal} />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}