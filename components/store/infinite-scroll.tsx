"use client";

import { useEffect, useRef } from "react";

interface Props {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

export function InfiniteScroll({ onLoadMore, hasMore, isLoading }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  return (
    <div ref={ref} className="flex justify-center py-8">
      {isLoading && (
        <div className="flex items-center gap-3 text-[#11ABC4]">
          <div className="w-5 h-5 border-2 border-[#11ABC4] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Cargando más productos...</span>
        </div>
      )}
      {!hasMore && !isLoading && (
        <p className="text-sm text-gray-400">Has visto todos los productos</p>
      )}
    </div>
  );
}
