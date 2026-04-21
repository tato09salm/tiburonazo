"use client";
import { useRef, useEffect, useState, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
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
  
  // 1. Usamos un ref para rastrear si es la carga inicial del componente
  const isFirstRender = useRef(true);
  
  const [scrollProgress, setScrollProgress] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true, 
    align: "start"
  });

  const onScroll = useCallback((emblaApi: any) => {
    const progress = Math.max(0, Math.min(1, emblaApi.scrollProgress()));
    setScrollProgress(progress * 100);
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    onScroll(emblaApi);
    emblaApi.on("scroll", onScroll);
    emblaApi.on("reInit", onScroll);
  }, [emblaApi, onScroll]);

  // 2. EFECTO CORREGIDO: Bloquea el scroll automático en la carga inicial
  useEffect(() => {
    // Si es la primera vez que se monta el componente, marcamos como cargado y NO hacemos scroll
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // El scroll solo debe ocurrir cuando el usuario hace clic en "Mostrar menos" 
    // (es decir, cuando showAll cambia de true a false)
    if (!showAll && buttonRef.current) {
      buttonRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [showAll]);

  // 3. Resetear el flag si las imágenes cambian (por si navegas de un producto a otro)
  useEffect(() => {
    isFirstRender.current = true;
  }, [images]);

  const visibleImages = showAll ? images : images.slice(0, 4);

  return (
    <div className="space-y-1">
      {/* ── VISTA MÓVIL: Full Width + Progress Bar ── */}
      <div className="md:hidden -mx-4">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {images.map((img, i) => (
              <div
                key={img.id}
                className="flex-[0_0_100%] min-w-0 relative bg-gray-50 aspect-[4/5]"
              >
                <ZoomImage
                  src={img.url}
                  alt={`${productTitle} ${i}`}
                  priority={i === 0}
                />
                
                {i === 0 && discountBadge && (
                  <div className="absolute top-4 left-4 z-10 pointer-events-none">
                    <span className="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded uppercase">
                      -{discountBadge}%
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Barrita de progreso */}
        <div className="px-4 mt-2">
          <div className="h-[2px] w-full bg-gray-100 relative overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-[#11ABC4] transition-transform duration-100 ease-out"
              style={{ 
                width: `${100 / images.length}%`,
                transform: `translateX(${(scrollProgress * (images.length - 1)) / (100 / 100)}%)` 
              }}
            />
          </div>
        </div>
      </div>

      {/* ── VISTA DESKTOP: Grid Original ── */}
      <div className="hidden md:grid grid-cols-2 gap-1">
        {visibleImages.map((img, i) => {
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

      {/* Botón Mostrar Más — Solo Desktop */}
      {images.length > 4 && (
        <button
          ref={buttonRef}
          onClick={onToggleShowAll}
          className="hidden md:flex w-full py-4 items-center justify-center gap-2 text-[10px] font-black text-gray-400 hover:text-[#11ABC4] transition-colors bg-gray-50 mt-1 uppercase tracking-[0.2em]"
        >
          {showAll ? (
            <><ChevronUp size={14} /> Mostrar menos</>
          ) : (
            <><ChevronDown size={14} /> Mostrar más</>
          )}
        </button>
      )}
    </div>
  );
}