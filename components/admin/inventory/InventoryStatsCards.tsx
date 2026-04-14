"use client";

import { useState } from "react";
import { 
  AlertTriangle, 
  PackageX, 
  History, 
  ChevronRight
} from "lucide-react";
import { DetailModal } from "./DetailModal";

interface StatsCardsProps {
  stats: {
    lowStock: any[];
    outOfStock: any[];
    noMovement: any[];
  };
}

export function InventoryStatsCards({ stats }: StatsCardsProps) {
  const [selectedCategory, setSelectedCategory] = useState<{
    title: string;
    items: any[];
  } | null>(null);

  const cards = [
    {
      title: "Stock Crítico",
      subtitle: "≤ 5 unidades",
      value: stats.lowStock.length,
      items: stats.lowStock,
      icon: <AlertTriangle size={18} />,
      color: "text-orange-600",
      bg: "bg-orange-100/50",
      border: "border-orange-100",
      hoverBorder: "hover:border-orange-400", // Borde más oscuro en hover
      hoverBg: "hover:bg-orange-200/50",      // Fondo más saturado en hover
      accent: "bg-orange-500",
    },
    {
      title: "Agotados",
      subtitle: "0 existencias",
      value: stats.outOfStock.length,
      items: stats.outOfStock,
      icon: <PackageX size={18} />,
      color: "text-red-600",
      bg: "bg-red-100/50",
      border: "border-red-100",
      hoverBorder: "hover:border-red-400",
      hoverBg: "hover:bg-red-200/50",
      accent: "bg-red-500",
    },
    {
      title: "Sin Movimiento",
      subtitle: "Últimos 30 días",
      value: stats.noMovement.length,
      items: stats.noMovement,
      icon: <History size={18} />,
      color: "text-slate-600",
      bg: "bg-slate-200/50",
      border: "border-slate-100",
      hoverBorder: "hover:border-slate-400",
      hoverBg: "hover:bg-slate-300/50",
      accent: "bg-slate-500",
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card, index) => (
          <button
            key={index}
            onClick={() => setSelectedCategory({ title: card.title, items: card.items })}
            className={`
              group relative flex items-center p-4 rounded-2xl border 
              ${card.border} ${card.bg} ${card.hoverBorder} ${card.hoverBg}
              text-left transition-all duration-300 ease-out
              active:scale-[0.97]
            `}
          >
            {/* Contenedor del Icono */}
            <div className={`
              flex-shrink-0 p-3 rounded-xl bg-white shadow-sm border 
              ${card.border} ${card.color} mr-4 
              group-hover:scale-110 transition-transform duration-300
            `}>
              {card.icon}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-gray-900 leading-none">
                  {card.value}
                </span>
              </div>
              <h3 className="font-bold text-gray-800 text-xs truncate uppercase tracking-tight mt-1">
                {card.title}
              </h3>
              <p className="text-[10px] text-gray-500 font-medium truncate">
                {card.subtitle}
              </p>
            </div>

            {/* Flecha lateral que aparece al hacer hover */}
            <div className="ml-2 transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1">
              <ChevronRight size={16} className={`${card.color}`} />
            </div>

            {/* Línea de acento lateral dinámica */}
            <div className={`
              absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full 
              ${card.accent} h-0 group-hover:h-2/3 transition-all duration-300
            `} />
          </button>
        ))}
      </div>

      {selectedCategory && (
        <DetailModal
          title={selectedCategory.title}
          items={selectedCategory.items}
          onClose={() => setSelectedCategory(null)}
        />
      )}
    </>
  );
}