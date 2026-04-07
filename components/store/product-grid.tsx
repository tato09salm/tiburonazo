"use client";

import { useInfiniteProducts } from "@/hooks/useInfiniteProducts";
import { ProductCardComponent } from "./product-card";
import { ProductGridSkeleton } from "@/components/common/Skeleton";
import { InfiniteScroll } from "./infinite-scroll";
import { useCallback } from "react";
import { Gender } from "@prisma/client";

interface Props {
  categorySlug?: string;
  sectionSlug?: string;
  gender?: Gender;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}

export function ProductGrid(props: Props) {
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteProducts(props);

  const loadMore = useCallback(() => {
    if (hasNextPage) fetchNextPage();
  }, [hasNextPage, fetchNextPage]);

  if (isLoading) return <ProductGridSkeleton />;

  const products = data?.pages.flatMap((p) => p.products) ?? [];

  if (!products.length) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-5xl mb-4">🏊</p>
        <p className="text-lg font-medium">No encontramos productos</p>
        <p className="text-sm mt-1">Intenta con otros filtros</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCardComponent key={product.id} product={product} />
        ))}
      </div>
      <InfiniteScroll
        onLoadMore={loadMore}
        hasMore={!!hasNextPage}
        isLoading={isFetchingNextPage}
      />
    </div>
  );
}
