import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/actions/product.actions";
import { PRODUCTS_PER_PAGE } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const sectionSlugParam = searchParams.get("sectionSlug") || searchParams.get("section") || undefined;
    const genderParam = searchParams.get("gender") || undefined;
    const outletParam = searchParams.get("outlet");

    const params = {
      page: Number(searchParams.get("page") ?? 1),
      limit: Number(searchParams.get("limit") ?? PRODUCTS_PER_PAGE),
      categorySlug: searchParams.get("categorySlug") || searchParams.get("category") || undefined,
      sectionSlug: sectionSlugParam,
      gender: genderParam,
      search: searchParams.get("search") ?? undefined,
      minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
      maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
      brandId: searchParams.get("brandId") ?? undefined,
      featured: searchParams.get("featured") === "true" ? true : undefined,
      outlet: outletParam === "true" ? true : undefined,
    };

    const result = await getProducts(params);
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({ error: "Error al obtener productos" }, { status: 500 });
  }
}
