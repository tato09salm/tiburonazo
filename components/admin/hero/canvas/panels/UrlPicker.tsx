"use client";

import { useState, useEffect } from "react";
import { PAGE_URLS } from "../types";
import { Search } from "lucide-react";

interface Props {
  value: string;
  onChange: (url: string) => void;
}

export function UrlPicker({ value, onChange }: Props) {
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : data?.categories || []))
      .catch(() => {});
  }, []);

  const allPages = [
    ...PAGE_URLS,
    ...categories.map((c) => ({ label: `Categoría: ${c.name}`, url: `/categoria/${c.slug}` })),
  ];

  const filtered = search
    ? allPages.filter((p) => p.label.toLowerCase().includes(search.toLowerCase()))
    : allPages;

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-gray-600 mb-1">URL del botón</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input text-sm flex-1"
          placeholder="/productos"
        />
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-gray-500 hover:border-[#11ABC4] hover:text-[#11ABC4] transition-colors shrink-0"
        >
          Páginas
        </button>
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-hidden">
            <div className="p-2 border-b border-slate-100">
              <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-1.5">
                <Search size={14} className="text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent text-sm w-full outline-none"
                  placeholder="Buscar página..."
                />
              </div>
            </div>
            <div className="overflow-y-auto max-h-48">
              {filtered.map((page) => (
                <button
                  key={page.url}
                  type="button"
                  onClick={() => {
                    onChange(page.url);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-[#11ABC4]/5 transition-colors ${
                    value === page.url ? "text-[#11ABC4] font-semibold bg-[#11ABC4]/5" : "text-gray-700"
                  }`}
                >
                  <span className="text-xs text-gray-400 mr-2 font-mono">{page.url}</span>
                  {page.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
