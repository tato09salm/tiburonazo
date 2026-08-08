"use client";

import { useState, useMemo } from "react";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { X, Search, Pencil, Eye, Boxes } from "lucide-react";
import Image from "next/image";

interface Variant {
  id: string;
  sku: string;
  price: number;
  oldPrice: number | null;
  stock: number;
  isActive: boolean;
  diseno: string | null;
  color?: { name: string; hex: string | null } | null;
  size?: { label: string } | null;
  productImage?: { url: string } | null;
}

interface Product {
  id: string;
  title: string;
  code: string;
  category: { name: string };
  brand?: { name: string } | null;
  images: { url: string }[];
  variants: Variant[];
}

interface ModalProps {
  product: Product;
  onClose: () => void;
}

export function ProductVariantsModal({ product, onClose }: ModalProps) {
  const [search, setSearch] = useState("");
  const [selectedSize, setSelectedSize] = useState("all");
  const [selectedColor, setSelectedColor] = useState("all");

  const variants = product.variants;

  // Extract unique sizes and colors from the variants
  const uniqueSizes = useMemo(() => {
    const list = variants
      .map((v) => v.size?.label)
      .filter((l): l is string => !!l);
    return Array.from(new Set(list)).sort();
  }, [variants]);

  const uniqueColors = useMemo(() => {
    const list = variants
      .map((v) => v.color?.name)
      .filter((n): n is string => !!n);
    return Array.from(new Set(list)).sort();
  }, [variants]);

  // Compute filtered variants
  const filteredVariants = useMemo(() => {
    return variants.filter((v) => {
      const skuMatch = v.sku.toLowerCase().includes(search.toLowerCase());
      const colorMatch = (v.color?.name || "")
        .toLowerCase()
        .includes(search.toLowerCase());
      const sizeMatch = (v.size?.label || "")
        .toLowerCase()
        .includes(search.toLowerCase());
      const disenoMatch = (v.diseno || "")
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesSearch =
        skuMatch || colorMatch || sizeMatch || disenoMatch;

      const matchesSize = selectedSize === "all" || v.size?.label === selectedSize;
      const matchesColor = selectedColor === "all" || v.color?.name === selectedColor;

      return matchesSearch && matchesSize && matchesColor;
    });
  }, [variants, search, selectedSize, selectedColor]);

  // Compute total stock of filtered variants
  const filteredStock = useMemo(() => {
    return filteredVariants.reduce((sum, v) => sum + v.stock, 0);
  }, [filteredVariants]);

  // Total stock of all variants (for header)
  const totalStock = useMemo(() => {
    return variants.reduce((sum, v) => sum + v.stock, 0);
  }, [variants]);

  // Helper to determine status dot
  const getStatusIndicator = (stock: number) => {
    if (stock === 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-100">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Sin Stock
        </span>
      );
    }
    if (stock <= 3) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Bajo Stock
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Disponible
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200" 
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in duration-200 border border-gray-100 relative z-10">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between bg-gray-50/50">
          <div className="min-w-0 flex-1 pr-4">
            <h3 className="font-heading text-lg font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wide truncate">
              {product.title} <span className="text-gray-300">|</span> <span className="font-mono text-gray-400 font-medium text-base">{product.code}</span>
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="text-[10px] font-bold text-[#11ABC4] bg-[#CCECFB] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {product.category.name}
              </span>
              {product.brand?.name && (
                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {product.brand.name}
                </span>
              )}
              <span className="text-[10px] font-bold text-gray-600 bg-gray-200/60 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Stock total: {totalStock} uds.
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            title="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar variante..."
              className="input pl-9 pr-4 py-2 w-full h-9 text-xs rounded-xl border-gray-200 focus:ring-[#11ABC4]/20 focus:border-[#11ABC4]"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 focus:outline-none focus:border-[#11ABC4] focus:ring-1 focus:ring-[#11ABC4] transition-colors w-full sm:w-auto cursor-pointer"
            >
              <option value="all">Todas las tallas</option>
              {uniqueSizes.map((size) => (
                <option key={size} value={size}>
                  Talla: {size}
                </option>
              ))}
            </select>
            <select
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 focus:outline-none focus:border-[#11ABC4] focus:ring-1 focus:ring-[#11ABC4] transition-colors w-full sm:w-auto cursor-pointer"
            >
              <option value="all">Todos los colores</option>
              {uniqueColors.map((color) => (
                <option key={color} value={color}>
                  Color: {color}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Variants List Table */}
        <div className="flex-1 overflow-y-auto px-6">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-white border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="py-3 px-2 text-center w-12">IMG</th>
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3">Color</th>
                <th className="py-3 px-3">Talla</th>
                <th className="py-3 px-3 text-right">Precio</th>
                <th className="py-3 px-3 text-right text-red-500">Oferta</th>
                <th className="py-3 px-3 text-right">Stock</th>
                <th className="py-3 px-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredVariants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400 font-medium italic">
                    No se encontraron variantes con los filtros activos.
                  </td>
                </tr>
              ) : (
                filteredVariants.map((v) => {
                  const imageUrl = v.productImage?.url || product.images[0]?.url;
                  return (
                    <tr key={v.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-2.5 px-2 text-center">
                        <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 mx-auto flex items-center justify-center">
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={v.sku}
                              fill
                              sizes="32px"
                              className="object-cover"
                            />
                          ) : (
                            <span className="text-sm">👕</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-gray-700">{v.sku}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          {v.color?.hex && (
                            <span 
                              className="w-3.5 h-3.5 rounded-full border border-gray-200 flex-shrink-0"
                              style={{ backgroundColor: v.color.hex }}
                            />
                          )}
                          <span className="font-semibold text-gray-800">{v.color?.name || "Sin color"}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-gray-600 font-bold">{v.size?.label || "Sin talla"}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-gray-800">{formatPrice(v.price)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-red-500">
                        {v.oldPrice ? formatPrice(v.oldPrice) : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-gray-800">{v.stock}</td>
                      <td className="py-2.5 px-4 text-center">{getStatusIndicator(v.stock)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
            <span>{filteredVariants.length} variantes encontradas</span>
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            <span>Stock de selección: {filteredStock} uds.</span>
          </div>
          <Link
            href={`/admin/products/${product.id}/edit`}
            className="inline-flex items-center gap-1.5 px-4.5 py-2 bg-[#11ABC4] hover:bg-[#0e98af] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm transition-all flex-shrink-0 active:scale-95"
            title="Editar producto"
          >
            <Pencil size={13} /> Editar producto
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ProductVariantsButton({ product }: { product: any }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs text-[#11ABC4] hover:bg-[#CCECFB] px-3 py-1.5 rounded-lg transition-colors font-semibold cursor-pointer"
        title="Ver variantes"
      >
        <Boxes size={13} /> Variantes
      </button>

      {isOpen && (
        <ProductVariantsModal 
          product={product} 
          onClose={() => setIsOpen(false)} 
        />
      )}
    </>
  );
}
