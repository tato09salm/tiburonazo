"use client";

import { useCartStore } from "@/store/cartStore";
import { CartItem } from "@/types";

export function useCart() {
  const { items, addItem, removeItem, updateQuantity, clearCart, total, count } = useCartStore();

  function add(item: CartItem) {
    addItem(item);
  }

  function remove(variantId: string) {
    removeItem(variantId);
  }

  function update(variantId: string, qty: number) {
    updateQuantity(variantId, qty);
  }

  return {
    items,
    addItem: add,
    removeItem: remove,
    updateQuantity: update,
    clearCart,
    total: total(),
    count: count(),
  };
}
