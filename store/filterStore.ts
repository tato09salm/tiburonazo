import { create } from "zustand";
import { Gender } from "@prisma/client";

interface FilterStore {
  search: string;
  categorySlug: string;
  gender: Gender | "";
  minPrice: number;
  maxPrice: number;
  brand: string;
  setSearch: (v: string) => void;
  setCategorySlug: (v: string) => void;
  setGender: (v: Gender | "") => void;
  setPriceRange: (min: number, max: number) => void;
  setBrand: (v: string) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  search: "",
  categorySlug: "",
  gender: "",
  minPrice: 0,
  maxPrice: 9999,
  brand: "",
  setSearch: (search) => set({ search }),
  setCategorySlug: (categorySlug) => set({ categorySlug }),
  setGender: (gender) => set({ gender }),
  setPriceRange: (minPrice, maxPrice) => set({ minPrice, maxPrice }),
  setBrand: (brand) => set({ brand }),
  resetFilters: () => set({ search: "", categorySlug: "", gender: "", minPrice: 0, maxPrice: 9999, brand: "" }),
}));
