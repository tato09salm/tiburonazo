"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, Tag, CheckCircle2 } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";

interface Category {
  id: string;
  name: string;
}

interface Props {
  categories: Category[];
}

export function ProductFilters({ categories }: Props) {
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
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-4 mb-6">
      
      {/* Search */}
      <div className="relative flex-grow w-full md:w-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Buscar por nombre o código..."
          className="input pl-10 h-11 text-sm w-full border-gray-200 focus:border-[#11ABC4]"
          onChange={(e) => handleSearch(e.target.value)}
          defaultValue={searchParams.get("search")?.toString()}
        />
      </div>

      {/* Category Filter */}
      <div className="relative min-w-[200px] w-full md:w-auto">
        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <select
          className="input pl-10 h-11 text-sm appearance-none cursor-pointer border-gray-200 bg-white"
          onChange={(e) => handleFilterChange("category", e.target.value)}
          defaultValue={searchParams.get("category") || ""}
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Status Filter */}
      <div className="relative min-w-[160px] w-full md:w-auto">
        <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <select
          className="input pl-10 h-11 text-sm appearance-none cursor-pointer border-gray-200 bg-white"
          onChange={(e) => handleFilterChange("status", e.target.value)}
          defaultValue={searchParams.get("status") || ""}
        >
          <option value="">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="hidden">Ocultos</option>
        </select>
      </div>

    </div>
  );
}
