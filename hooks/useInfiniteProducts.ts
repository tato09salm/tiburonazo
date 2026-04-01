"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { PRODUCTS_PER_PAGE } from "@/lib/constants";
import { Gender } from "@prisma/client";

interface Params {
  categorySlug?: string;
  gender?: Gender;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  brandId?: string;
}

async function fetchProducts(params: Params & { page: number }) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== undefined && v !== "" && qs.set(k, String(v)));
  const res = await fetch(`/api/products?${qs.toString()}`);
  if (!res.ok) throw new Error("Error cargando productos");
  return res.json();
}

export function useInfiniteProducts(params: Params = {}) {
  return useInfiniteQuery({
    queryKey: ["products", params],
    queryFn: ({ pageParam = 1 }) => fetchProducts({ ...params, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.pages ? last.page + 1 : undefined),
    staleTime: 60_000,
  });
}
