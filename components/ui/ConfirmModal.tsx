"use client";

import { X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  loading?: boolean;
}

export function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirmar", 
  cancelText = "Cancelar",
  type = "danger",
  loading = false
}: Props) {
  if (!isOpen) return null;

  const colors = {
    danger: "bg-red-50 text-red-600 border-red-100",
    warning: "bg-amber-50 text-amber-600 border-amber-100",
    info: "bg-blue-50 text-blue-600 border-blue-100"
  };

  const btnColors = {
    danger: "bg-red-600 hover:bg-red-700 shadow-red-100",
    warning: "bg-amber-600 hover:bg-amber-700 shadow-amber-100",
    info: "bg-blue-600 hover:bg-blue-700 shadow-blue-100"
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={cn("p-2 rounded-xl border", colors[type])}>
              <AlertCircle size={20} />
            </div>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={20} className="text-gray-400" />
            </button>
          </div>
          
          <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            {message}
          </p>

          <div className="flex gap-3">
            <button 
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {cancelText}
            </button>
            <button 
              onClick={onConfirm}
              disabled={loading}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2",
                btnColors[type],
                loading && "opacity-70 cursor-not-allowed"
              )}
            >
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
