"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ZoomImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

export function ZoomImage({ src, alt, className, priority = false }: ZoomImageProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showZoom, setShowZoom] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setPosition({ x, y });
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setShowZoom(true)}
      onMouseLeave={() => setShowZoom(false)}
      onMouseMove={handleMouseMove}
      className={cn("relative overflow-hidden cursor-zoom-in bg-gray-50 w-full h-full", className)}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className={cn(
          "object-cover transition-transform duration-500 ease-out",
          showZoom ? "scale-[2.2]" : "scale-100"
        )}
        style={{ transformOrigin: showZoom ? `${position.x}% ${position.y}%` : "center" }}
        priority={priority}
      />
    </div>
  );
}