"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FONT_GROUPS, DEFAULT_FONTS } from "../types";

interface Props {
  value: string;
  onChange: (font: string) => void;
}

export function FontSelector({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? DEFAULT_FONTS.filter((f) => f.toLowerCase().includes(query.toLowerCase()))
    : null;

  const groups = filtered ?? FONT_GROUPS;
  const flatList = filtered ?? DEFAULT_FONTS;

  useEffect(() => {
    if (open) {
      setQuery("");
      setHighlightIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const select = useCallback((font: string) => {
    onChange(font);
    setOpen(false);
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, flatList.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatList[highlightIndex]) select(flatList[highlightIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  useEffect(() => {
    if (!open || !listRef.current) return;
    const item = listRef.current.querySelector(`[data-index="${highlightIndex}"]`);
    item?.scrollIntoView({ block: "nearest" });
  }, [highlightIndex, open]);

  const renderGroup = (groupName: string, fonts: string[]) => {
    if (fonts.length === 0) return null;
    return (
      <div key={groupName}>
        <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          {groupName}
        </div>
        {fonts.map((font) => {
          const idx = flatList.indexOf(font);
          const isSelected = font === value;
          const isHighlighted = idx === highlightIndex;
          return (
            <button
              key={font}
              data-index={idx}
              type="button"
              onMouseEnter={() => setHighlightIndex(idx)}
              onMouseDown={(e) => { e.preventDefault(); select(font); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                isHighlighted ? "bg-primary/10" : ""
              } ${isSelected ? "font-semibold" : ""}`}
              style={isSelected ? { color: "#11ABC4" } : undefined}
            >
              {isSelected && (
                <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                </svg>
              )}
              {!isSelected && <span className="w-3.5 shrink-0" />}
              <span style={{ fontFamily: `"${font}", sans-serif` }}>{font}</span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="input text-sm py-1.5 flex items-center justify-between gap-2 w-full"
      >
        <span style={{ fontFamily: `"${value}", sans-serif` }} className="truncate">
          {value}
        </span>
        <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl max-h-[280px] flex flex-col overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setHighlightIndex(0); }}
              onKeyDown={handleKeyDown}
              placeholder="Buscar fuente..."
              className="w-full text-sm px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-gray-400"
            />
          </div>
          <div ref={listRef} className="flex-1 overflow-y-auto py-1" style={{ scrollbarWidth: "thin" }}>
            {query.trim() ? (
              flatList.length > 0 ? (
                flatList.map((font, idx) => {
                  const isSelected = font === value;
                  const isHighlighted = idx === highlightIndex;
                  return (
                    <button
                      key={font}
                      data-index={idx}
                      type="button"
                      onMouseEnter={() => setHighlightIndex(idx)}
                      onMouseDown={(e) => { e.preventDefault(); select(font); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                        isHighlighted ? "bg-primary/10" : ""
                      } ${isSelected ? "font-semibold" : ""}`}
                      style={isSelected ? { color: "#11ABC4" } : undefined}
                    >
                      {isSelected && (
                        <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                        </svg>
                      )}
                      {!isSelected && <span className="w-3.5 shrink-0" />}
                      <span style={{ fontFamily: `"${font}", sans-serif` }}>{font}</span>
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-4 text-sm text-gray-400 text-center">Sin resultados</div>
              )
            ) : (
              Object.entries(groups).map(([group, fonts]) => renderGroup(group, fonts))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
