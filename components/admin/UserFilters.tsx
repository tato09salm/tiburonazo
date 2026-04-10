"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, UserCheck } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";

export function UserFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    if (term) params.set("search", term);
    else params.delete("search");
    router.push(`?${params.toString()}`);
  }, 300);

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    if (value && value !== "ALL") params.set(key, value);
    else params.delete(key);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-row items-center gap-3">
      
      {/* 1. Buscador (Ocupa el espacio disponible: flex-grow) */}
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Buscar usuario o email..."
          className="input pl-10 h-10 text-sm w-full border-gray-200 focus:border-[#11ABC4]"
          onChange={(e) => {
            const val = e.target.value.toLowerCase();
            e.target.value = val;
            handleSearch(val);
          }}
          defaultValue={searchParams.get("search")?.toString()}
        />
      </div>

      {/* 2. Filtro de Rol */}
      <div className="relative min-w-[140px]">
        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
        <select
          className="input pl-9 h-10 text-xs appearance-none cursor-pointer border-gray-200"
          onChange={(e) => handleFilterChange("role", e.target.value)}
          defaultValue={searchParams.get("role") || "ALL"}
        >
          <option value="ALL">Todos los roles</option>
          <option value="ADMIN">Admin</option>
          <option value="VENDEDOR">Vendedor</option>
          <option value="CLIENTE">Cliente</option>
        </select>
      </div>

      {/* 3. Filtro de Estado */}
      <div className="relative min-w-[140px]">
        <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
        <select
          className="input pl-9 h-10 text-xs appearance-none cursor-pointer border-gray-200"
          onChange={(e) => handleFilterChange("status", e.target.value)}
          defaultValue={searchParams.get("status") || "ALL"}
        >
          <option value="ALL">Todos los estados</option>
          <option value="ACTIVE">Activos</option>
          <option value="INACTIVE">Inactivos</option>
        </select>
      </div>

    </div>
  );
}