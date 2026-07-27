"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { HeroSlideContent } from "./HeroSlideContent";
import { CanvasSlideRenderer } from "./CanvasSlideRenderer";
import type { CanvasSlideData } from "@/components/admin/hero/canvas/types";

interface Slide {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  badge: string | null;
  button1Text: string | null;
  button1Url: string | null;
  button2Text: string | null;
  button2Url: string | null;
  imageUrl: string | null;
  gifUrl: string | null;
  backgroundImageUrl: string | null;
  backgroundColor: string | null;
  textColor: string;
  buttonColor: string;
  contentPosition: "LEFT" | "CENTER" | "RIGHT";
  displayDuration: number;
  canvasData: CanvasSlideData | null;
}

interface HeroSliderProps {
  slides: Slide[];
}

export function HeroSlider({ slides }: HeroSliderProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    duration: 50,
    align: "start",
    skipSnaps: false,
    containScroll: "trimSnaps",
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", () => setScrollSnaps(emblaApi.scrollSnapList()));
    onSelect();
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi || slides.length < 2) return;

    const startAutoplay = () => {
      const duration = slides[selectedIndex]?.displayDuration || 5;
      autoplayRef.current = setInterval(() => {
        if (!isPaused) emblaApi.scrollNext();
      }, duration * 1000);
    };

    const stopAutoplay = () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
        autoplayRef.current = null;
      }
    };

    stopAutoplay();
    startAutoplay();

    return stopAutoplay;
  }, [emblaApi, slides, isPaused, selectedIndex]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  if (!slides.length) {
    return (
      <section className="relative h-[420px] md:h-[560px] lg:h-[720px] w-full overflow-hidden bg-gradient-to-br from-[#0a1628] via-[#0d2a3a] to-[#0d8fa6]">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-[#11ABC4] blur-3xl" />
          <div className="absolute bottom-10 right-10 w-[500px] h-[500px] rounded-full bg-[#00D4DD] blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-blue-500 blur-3xl" />
        </div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMxMUFCQzQiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzEuNjU3IDAgMy0xLjM0MyAzLTNzLTEuMzQzLTMtMy0zLTMgMS4zNDMtMyAzIDEuMzQzIDMgMyAzem0wIDM2YzEuNjU3IDAgMy0xLjM0MyAzLTNzLTEuMzQzLTMtMy0zLTMgMS4zNDMtMyAzIDEuMzQzIDMgMyAzeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative z-10 h-full flex items-center justify-center px-4">
          <div className="text-center max-w-2xl">
            <span className="inline-block bg-white/10 backdrop-blur-md border border-white/20 text-white/80 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 uppercase tracking-widest animate-fade-in">
              Tiburonazo
            </span>
            <h1 className="font-brand text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-tight mb-4">
              NADA SIN <br />
              <span className="text-[#11ABC4]">LÍMITES</span>
            </h1>
            <p className="text-gray-300 text-lg mb-8 max-w-lg mx-auto">
              Equípate con lo mejor en ropa de natación, accesorios y más.
            </p>
            <Link
              href="/productos"
              className="inline-flex items-center gap-2 font-bold px-8 py-3 rounded-xl bg-[#11ABC4] text-white text-base transition-all hover:bg-[#0d8fa6] hover:shadow-lg hover:scale-105 active:scale-95"
            >
              Ver colección <ArrowRight size={18} />
            </Link>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L60 50C120 40 240 20 360 15C480 10 600 20 720 25C840 30 960 30 1080 25C1200 20 1320 10 1380 5L1440 0V60H0Z" fill="#f8fbff" />
          </svg>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative w-full overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Hero slider - promociones y colecciones"
    >
      {/* Carousel viewport */}
      <div
        ref={emblaRef}
        className="overflow-hidden"
      >
        <div className="flex">
          {slides.map((slide, idx) => (
            <div
              key={slide.id}
              className="relative min-w-0 flex-[0_0_100%]"
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${idx + 1} de ${slides.length}`}
            >
              <div className="h-[420px] md:h-[560px] lg:h-[720px] w-full">
                {slide.canvasData ? (
                  <CanvasSlideRenderer data={slide.canvasData} />
                ) : (
                  <HeroSlideContent
                    title={slide.title}
                    subtitle={slide.subtitle}
                    description={slide.description}
                    badge={slide.badge}
                    button1Text={slide.button1Text}
                    button1Url={slide.button1Url}
                    button2Text={slide.button2Text}
                    button2Url={slide.button2Url}
                    imageUrl={slide.imageUrl}
                    gifUrl={slide.gifUrl}
                    backgroundImageUrl={slide.backgroundImageUrl}
                    backgroundColor={slide.backgroundColor}
                    textColor={slide.textColor}
                    buttonColor={slide.buttonColor}
                    contentPosition={slide.contentPosition}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gradient overlays for arrows */}
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-black/20 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-black/20 to-transparent pointer-events-none z-10" />

      {/* Navigation arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 p-2 md:p-3 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/30 transition-all focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Slide anterior"
          >
            <ChevronLeft size={20} className="md:w-6 md:h-6" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 p-2 md:p-3 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/30 transition-all focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Slide siguiente"
          >
            <ChevronRight size={20} className="md:w-6 md:h-6" />
          </button>
        </>
      )}

      {/* Dots */}
      {slides.length > 1 && (
        <div
          className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2"
          role="tablist"
          aria-label="Navegación de slides"
        >
          {scrollSnaps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollTo(idx)}
              className={cn(
                "rounded-full transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-white/50",
                idx === selectedIndex
                  ? "w-8 h-2.5 bg-white"
                  : "w-2.5 h-2.5 bg-white/40 hover:bg-white/70"
              )}
              role="tab"
              aria-selected={idx === selectedIndex}
              aria-label={`Ir al slide ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Wave divider at bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 60L60 50C120 40 240 20 360 15C480 10 600 20 720 25C840 30 960 30 1080 25C1200 20 1320 10 1380 5L1440 0V60H0Z" fill="#f8fbff" />
        </svg>
      </div>
    </section>
  );
}
