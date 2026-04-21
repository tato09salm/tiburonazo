"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Calendar, User, CreditCard, DollarSign, Filter } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useDebouncedCallback } from "use-debounce";
import { PAYMENT_METHODS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Props {
  vendedores: { id: string; name: string }[];
}

type FilterTab = 'general' | 'date' | 'details' | 'amount';

export function SalesFilters({ vendedores }: { vendedores: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<FilterTab>('general');
  
  const [filters, setFilters] = useState({
    from: searchParams.get("from") || "",
    to: searchParams.get("to") || "",
    vendedorId: searchParams.get("vendedorId") || "",
    paymentMethod: searchParams.get("paymentMethod") || "",
    status: searchParams.get("status") || "",
    client: searchParams.get("client") || "",
    minTotal: searchParams.get("minTotal") || "",
    maxTotal: searchParams.get("maxTotal") || "",
  });

  useEffect(() => {
    setFilters({
      from: searchParams.get("from") || "",
      to: searchParams.get("to") || "",
      vendedorId: searchParams.get("vendedorId") || "",
      paymentMethod: searchParams.get("paymentMethod") || "",
      status: searchParams.get("status") || "",
      client: searchParams.get("client") || "",
      minTotal: searchParams.get("minTotal") || "",
      maxTotal: searchParams.get("maxTotal") || "",
    });
  }, [searchParams]);

  const debouncedPush = useDebouncedCallback((params: URLSearchParams) => {
    router.push(`?${params.toString()}`, { scroll: false });
  }, 500);

  const updateURL = useCallback((key: string, value: string, immediate = false) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    if (immediate) {
      router.push(`?${params.toString()}`, { scroll: false });
    } else {
      debouncedPush(params);
    }
  }, [searchParams, router, debouncedPush]);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    if (key === "minTotal" || key === "maxTotal") {
      const numVal = value === "" ? NaN : Number(value);
      if (value !== "" && isNaN(numVal)) return;
      
      const min = key === "minTotal" ? numVal : Number(filters.minTotal);
      const max = key === "maxTotal" ? numVal : Number(filters.maxTotal);
      
      if (!isNaN(min) && !isNaN(max) && min > max && max !== 0) {
        return;
      }
    }

    const isImmediate = ["from", "to", "vendedorId", "paymentMethod", "status"].includes(key);
    updateURL(key, value, isImmediate);
  };

  const clearFilters = () => {
    setFilters({
      from: "",
      to: "",
      vendedorId: "",
      paymentMethod: "",
      status: "",
      client: "",
      minTotal: "",
      maxTotal: "",
    });
    router.push("/admin/sales");
  };

  const hasFilters = Object.values(filters).some(v => v !== "");

  // Count active filters per category
  const activeCount = {
    general: filters.client ? 1 : 0,
    date: (filters.from ? 1 : 0) + (filters.to ? 1 : 0),
    details: (filters.vendedorId ? 1 : 0) + (filters.paymentMethod ? 1 : 0) + (filters.status ? 1 : 0),
    amount: (filters.minTotal ? 1 : 0) + (filters.maxTotal ? 1 : 0)
  };

  return (
    <div className="card p-0 mb-6 bg-white shadow-sm border border-gray-100 overflow-hidden">
      {/* Header with Category Tabs */}
      <div className="bg-gray-50/50 border-b border-gray-100 p-1 flex flex-wrap items-center gap-1">
        <button
          onClick={() => setActiveTab('general')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all",
            activeTab === 'general' ? "bg-white text-[#11ABC4] shadow-sm" : "text-gray-500 hover:bg-gray-100"
          )}
        >
          <Search size={14} /> Búsqueda {activeCount.general > 0 && <span className="w-1.5 h-1.5 rounded-full bg-[#11ABC4]" />}
        </button>
        <button
          onClick={() => setActiveTab('date')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all",
            activeTab === 'date' ? "bg-white text-[#11ABC4] shadow-sm" : "text-gray-500 hover:bg-gray-100"
          )}
        >
          <Calendar size={14} /> Fechas {activeCount.date > 0 && <span className="w-4 h-4 rounded-full bg-[#11ABC4] text-white text-[10px] flex items-center justify-center">{activeCount.date}</span>}
        </button>
        <button
          onClick={() => setActiveTab('details')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all",
            activeTab === 'details' ? "bg-white text-[#11ABC4] shadow-sm" : "text-gray-500 hover:bg-gray-100"
          )}
        >
          <Filter size={14} /> Detalles {activeCount.details > 0 && <span className="w-4 h-4 rounded-full bg-[#11ABC4] text-white text-[10px] flex items-center justify-center">{activeCount.details}</span>}
        </button>
        <button
          onClick={() => setActiveTab('amount')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all",
            activeTab === 'amount' ? "bg-white text-[#11ABC4] shadow-sm" : "text-gray-500 hover:bg-gray-100"
          )}
        >
          <DollarSign size={14} /> Montos {activeCount.amount > 0 && <span className="w-4 h-4 rounded-full bg-[#11ABC4] text-white text-[10px] flex items-center justify-center">{activeCount.amount}</span>}
        </button>

        <div className="ml-auto pr-3">
          {hasFilters && (
            <button 
              onClick={clearFilters}
              className="text-stone-100 hover:text-stone-200 text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all px-3 py-1.5 bg-red-500 rounded-xl shadow-sm hover:shadow-md active:scale-95"
            >
              <X size={12} /> Limpiar todo
            </button>
          )}
        </div>
      </div>

      {/* Filter Inputs Area */}
      <div className="p-4 bg-white animate-in fade-in slide-in-from-top-1 duration-200">
        {activeTab === 'general' && (
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Buscar por Producto, SKU, Destino o Notas</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Escribe el nombre del producto, SKU, cuenta de destino o alguna nota..."
                  value={filters.client}
                  onChange={(e) => handleFilterChange("client", e.target.value)}
                  className="input pl-10 h-11 text-sm w-full"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'date' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Desde la fecha</label>
              <input 
                type="date" 
                value={filters.from}
                max={filters.to || undefined}
                onChange={(e) => handleFilterChange("from", e.target.value)}
                className="input h-11 text-sm w-full"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Hasta la fecha</label>
              <input 
                type="date" 
                value={filters.to}
                min={filters.from || undefined}
                onChange={(e) => handleFilterChange("to", e.target.value)}
                className="input h-11 text-sm w-full"
              />
            </div>
          </div>
        )}

        {activeTab === 'details' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Vendedor</label>
              <select 
                value={filters.vendedorId}
                onChange={(e) => handleFilterChange("vendedorId", e.target.value)}
                className="input h-11 text-sm w-full"
              >
                <option value="">Todos los vendedores</option>
                {vendedores.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Método de Pago</label>
              <select 
                value={filters.paymentMethod}
                onChange={(e) => handleFilterChange("paymentMethod", e.target.value)}
                className="input h-11 text-sm w-full"
              >
                <option value="">Todos los métodos</option>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>{method.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Estado de la Venta</label>
              <select 
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="input h-11 text-sm w-full"
              >
                <option value="">Todos los estados</option>
                <option value="COMPLETADA">Completada</option>
                <option value="ANULADA">Anulada</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'amount' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Monto Mínimo (S/)</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="number" 
                  placeholder="0.00"
                  value={filters.minTotal}
                  onChange={(e) => handleFilterChange("minTotal", e.target.value)}
                  className="input pl-10 h-11 text-sm w-full"
                  min={0}
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Monto Máximo (S/)</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="number" 
                  placeholder="Sin límite"
                  value={filters.maxTotal}
                  onChange={(e) => handleFilterChange("maxTotal", e.target.value)}
                  className="input pl-10 h-11 text-sm w-full"
                  min={0}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
