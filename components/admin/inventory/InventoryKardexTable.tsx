"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ArrowDown,
  ArrowUp,
  Search,
  Clock,
  Package,
  FilterX,
  CalendarDays,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KardexProps {
  initialMoves: any[];
}

export function InventoryKardexTable({ initialMoves }: KardexProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // --- ESTADO DE PAGINACIÓN ---
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;

  const filteredMoves = useMemo(() => {
    return initialMoves.filter((move) => {
      const moveDate = new Date(move.date).getTime();
      const start = startDate ? new Date(startDate).getTime() : null;
      const end = endDate ? new Date(endDate).getTime() : null;

      const matchesSearch =
        move.variant.product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        move.variant.sku.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === "ALL" || move.type === typeFilter;
      const matchesDate = (!start || moveDate >= start) &&
        (!end || moveDate <= (end + 86400000));

      return matchesSearch && matchesType && matchesDate;
    });
  }, [searchTerm, typeFilter, startDate, endDate, initialMoves]);

  // --- LÓGICA DE PAGINACIÓN ---
  const totalPages = Math.ceil(filteredMoves.length / rowsPerPage);

  // Reiniciar a la página 1 cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, startDate, endDate]);

  const paginatedMoves = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredMoves.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredMoves, currentPage]);

  const resetFilters = () => {
    setSearchTerm("");
    setTypeFilter("ALL");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="flex flex-col bg-white">
      {/* --- PANEL DE FILTROS --- */}
      <div className="px-6 py-2 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border-b border-gray-100">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative w-full md:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#11ABC4] transition-colors" size={14} />
            <input
              type="text"
              placeholder="Buscar por producto o SKU..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-transparent rounded-xl text-xs font-medium outline-none focus:border-[#11ABC4]/30 focus:ring-4 focus:ring-[#11ABC4]/10 transition-all duration-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2 px-2">
              <CalendarDays size={12} className="text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-[9px] font-bold uppercase outline-none cursor-pointer text-gray-700"
              />
              <span className="text-gray-300">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-[9px] font-bold uppercase outline-none cursor-pointer text-gray-700"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100/50 rounded-lg p-0.5 border border-gray-100">
            {["ALL", "ENTRADA", "SALIDA"].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={cn(
                  "px-3 py-1 rounded-md text-[9px] font-black tracking-widest transition-all",
                  typeFilter === t
                    ? "bg-white text-[#11ABC4] shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                {t === "ALL" ? "TODOS" : t}
              </button>
            ))}
          </div>

          {(searchTerm || typeFilter !== "ALL" || startDate || endDate) && (
            <button
              onClick={resetFilters}
              className="p-2 text-red-400 hover:text-red-600 transition-colors"
              title="Limpiar filtros"
            >
              <FilterX size={16} />
            </button>
          )}
        </div>
      </div>

      {/* --- TABLA --- */}
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr className="bg-gray-50/50 text-[9px] font-black text-gray-500 uppercase tracking-widest">
              <th className="px-6 py-3 text-left border-b border-gray-100">Fecha</th>
              <th className="px-4 py-3 text-left border-b border-gray-100">Producto</th>
              <th className="px-4 py-3 text-left border-b border-gray-100">Tipo</th>
              <th className="px-4 py-3 text-center border-b border-gray-100">Cant.</th>
              <th className="px-4 py-3 text-center border-b border-gray-100">Stock Final</th>
              <th className="px-4 py-3 text-left border-b border-gray-100">Motivo</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {paginatedMoves.length > 0 ? (
              paginatedMoves.map((move, index) => (
                <tr key={move.id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className={cn("px-6 py-2.5", index !== paginatedMoves.length - 1 && "border-b border-gray-50")}>
                    <div className="flex items-center gap-2">
                      <Clock size={12} className="text-gray-400" />
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-gray-700">
                          {new Date(move.date).toLocaleDateString("es-PE")}
                        </span>
                        <span className="text-[9px] text-gray-500">
                          {new Date(move.date).toLocaleTimeString("es-PE", { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className={cn("px-4 py-2.5", index !== paginatedMoves.length - 1 && "border-b border-gray-50")}>
                    <p className="text-[11px] font-black text-gray-800 line-clamp-1 leading-tight">
                      {move.variant.product.title}
                    </p>
                    <p className="text-[9px] font-mono text-gray-500 uppercase">SKU: {move.variant.sku}</p>
                  </td>
                  <td className={cn("px-4 py-2.5", index !== paginatedMoves.length - 1 && "border-b border-gray-50")}>
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black tracking-tight border",
                      move.type === "ENTRADA" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
                    )}>
                      {move.type === "ENTRADA" ? <ArrowDown size={10} /> : <ArrowUp size={10} />}
                      {move.type}
                    </span>
                  </td>
                  <td className={cn("px-4 py-2.5 text-center font-black text-xs text-gray-900", index !== paginatedMoves.length - 1 && "border-b border-gray-50")}>
                    {move.type === "SALIDA" ? `-${move.quantity}` : `+${move.quantity}`}
                  </td>
                  <td className={cn("px-4 py-2.5 text-center", index !== paginatedMoves.length - 1 && "border-b border-gray-50")}>
                    <span className="inline-block min-w-[30px] px-2 py-0.5 bg-gray-100 rounded text-[10px] font-black text-gray-600 border border-gray-200">
                      {move.stockAfter ?? '—'}
                    </span>
                  </td>
                  <td className={cn("px-4 py-2.5", index !== paginatedMoves.length - 1 && "border-b border-gray-50")}>
                    <p className="text-[10px] text-gray-500 font-medium truncate max-w-[200px]">
                      {move.reason || "—"}
                    </p>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-8 py-12 text-center opacity-30">
                  <Package size={32} className="mx-auto mb-2" />
                  <p className="text-xs font-bold uppercase tracking-widest">Sin registros</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- FOOTER CON PAGINACIÓN CENTRADA --- */}
      <div className="px-6 py-3 bg-white border-t border-gray-100 grid grid-cols-3 items-center">

        {/* Lado izquierdo (Vacío o información extra) */}
        <div className="hidden md:block">
          {/* Puedes dejarlo vacío para mantener el equilibrio */}
        </div>

        {/* CENTRO: Contador de registros */}
        <div className="flex justify-center">
          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
            Mostrando <span className="text-gray-600">{paginatedMoves.length}</span> de <span className="text-gray-700">{filteredMoves.length}</span> registros
          </p>
        </div>

        {/* Lado derecho: Controles de navegación */}
        <div className="flex justify-end items-center gap-2">
          {totalPages > 1 && (
            <>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-100 hover:bg-gray-50 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={14} className="text-gray-600" />
              </button>

              <div className="flex items-center gap-1.5 min-w-[60px] justify-center">
                <span className="text-[10px] font-black ">
                  {currentPage}
                </span>
                <span className="text-[10px] font-bold text-gray-300">/</span>
                <span className="text-[10px] font-bold text-gray-400">
                  {totalPages}
                </span>
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-gray-100 hover:bg-gray-50 disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={14} className="text-gray-600" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}