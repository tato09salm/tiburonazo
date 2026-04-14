"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, Package } from "lucide-react";
import { searchVariants } from "@/actions/admin.actions"; // Crea este action
import { useDebounce } from "@/hooks/useDebounce"; // Hook estándar para no saturar la DB

interface Variant {
  id: string;
  sku: string;
  stock: number;
  product: { title: string };
  color?: { name: string } | null;
  size?: { label: string } | null;
}

export function ProductSearch({ onSelect }: { onSelect: (v: Variant) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    async function fetchVariants() {
      setLoading(true);
      const data = await searchVariants(debouncedQuery);
      setResults(data);
      setLoading(false);
      setIsOpen(true);
    }
    fetchVariants();
  }, [debouncedQuery]);

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 text-gray-400" size={16} />
        <input
          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#11ABC4] focus:bg-white outline-none transition-all"
          placeholder="Buscar por nombre o SKU..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length > 1 && setIsOpen(true)}
        />
        {loading && <Loader2 className="absolute right-3 animate-spin text-gray-400" size={16} />}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl z-[100] max-h-60 overflow-y-auto p-1">
          {results.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => {
                onSelect(v);
                setQuery(`${v.product.title} - ${v.sku}`);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left border-b border-gray-50 last:border-0"
            >
              <div className="bg-gray-100 p-2 rounded-lg text-gray-400">
                <Package size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">{v.product.title}</p>
                <p className="text-[10px] text-gray-500 font-mono">
                  SKU: {v.sku} | {v.color?.name} | {v.size?.label}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-[#11ABC4]">{v.stock} uds.</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}