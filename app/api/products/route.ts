import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/actions/product.actions";
import { Gender } from "@prisma/client";
import { PRODUCTS_PER_PAGE } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const genderParam = searchParams.get("gender");
    let gender: Gender | undefined = undefined;
    if (genderParam) {
      const normalizedGender = genderParam.toUpperCase().replace("Ñ", "N");
      if (["ADULTO", "NINO", "BEBE", "UNISEX"].includes(normalizedGender)) {
        gender = normalizedGender as Gender;
      }
    }

    const params = {
      page: Number(searchParams.get("page") ?? 1),
      limit: Number(searchParams.get("limit") ?? PRODUCTS_PER_PAGE),
      categorySlug: searchParams.get("categorySlug") || searchParams.get("category") || undefined,
      sectionSlug: searchParams.get("sectionSlug") || searchParams.get("section") || undefined,
      gender,
      search: searchParams.get("search") ?? undefined,
      minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
      maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
      brandId: searchParams.get("brandId") ?? undefined,
      featured: searchParams.get("featured") === "true" ? true : undefined,
    };

    const result = await getProducts(params);
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({ error: "Error al obtener productos" }, { status: 500 });
  }
}
