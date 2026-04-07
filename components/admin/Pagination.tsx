"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({ totalPages }: { totalPages: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    router.push(`?${params.toString()}`);
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 py-4 border-t border-gray-100 bg-gray-50/50">
      <button
        onClick={() => createPageURL(currentPage - 1)}
        disabled={currentPage <= 1}
        className="p-2 rounded-lg hover:bg-white disabled:opacity-30 transition-all border border-transparent hover:border-gray-200"
      >
        <ChevronLeft size={18} />
      </button>
      
      <span className="text-sm font-medium text-gray-600">
        Página <span className="text-gray-900">{currentPage}</span> de {totalPages}
      </span>

      <button
        onClick={() => createPageURL(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="p-2 rounded-lg hover:bg-white disabled:opacity-30 transition-all border border-transparent hover:border-gray-200"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}