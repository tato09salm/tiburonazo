"use client";

import { useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { ZoomImage } from "./ZoomImage";
import type { ProductImage } from "@/types";

interface GalleryProps {
  images: ProductImage[];
  productTitle: string;
  discountBadge: number | null;
  showAll: boolean;
  onToggleShowAll: () => void;
}

export function ProductGallery({
  images,
  productTitle,
  discountBadge,
  showAll,
  onToggleShowAll,
}: GalleryProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Este ref nos permite saber si es la primera vez que se renderiza el componente
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Si es el primer renderizado, cambiamos el ref a false y salimos sin hacer scroll
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Solo ejecutamos el scroll si el usuario está ocultando imágenes (showAll pasa a false)
    if (!showAll) {
      const timer = setTimeout(() => {
        buttonRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100); // Un pequeño delay para esperar que el DOM se ajuste al ocultar
      
      return () => clearTimeout(timer);
    }
  }, [showAll]);

  // Decidimos cuántas imágenes mostrar: todas o solo las primeras 4
  const visibleImages = showAll ? images : images.slice(0, 4);

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-2 gap-1">
        {visibleImages.map((img, i) => {
          // Si es la última imagen y es impar (en la lista visible), ocupa las 2 columnas
          const isLastAndImpar =
            i === visibleImages.length - 1 && visibleImages.length % 2 !== 0;

          return (
            <div
              key={img.id}
              className={cn(
                "relative bg-gray-50 overflow-hidden animate-in fade-in duration-500",
                isLastAndImpar ? "col-span-2 aspect-[16/10]" : "aspect-[4/5]"
              )}
            >
              <ZoomImage src={img.url} alt={productTitle} priority={i < 2} />
              
              {/* Badge de descuento solo en la primera imagen */}
              {i === 0 && discountBadge && (
                <div className="absolute top-4 left-4 z-10 pointer-events-none">
                  <span className="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded shadow-lg uppercase">
                    -{discountBadge}%
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Solo mostramos el botón si hay más de 4 imágenes */}
      {images.length > 4 && (
        <button
          ref={buttonRef}
          onClick={onToggleShowAll}
          className="w-full py-4 flex items-center justify-center gap-2 text-[10px] font-black text-gray-400 hover:text-[#11ABC4] transition-colors bg-gray-50 mt-1 uppercase tracking-[0.2em]"
        >
          {showAll ? (
            <>
              <ChevronUp size={14} /> Mostrar menos
            </>
          ) : (
            <>
              <ChevronDown size={14} /> Mostrar más
            </>
          )}
        </button>
      )}
    </div>
  );
}