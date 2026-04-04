"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { updateProduct } from "@/actions/product.actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Props {
  productId: string;
  isActive: boolean;
}

export function ToggleProductStatus({ productId, isActive }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleToggle() {
    setLoading(true);
    try {
      await updateProduct(productId, { isActive: !isActive });
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Error al cambiar el estado del producto");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all font-semibold",
        isActive 
          ? "text-gray-500 hover:bg-gray-100" 
          : "text-green-600 bg-green-50 hover:bg-green-100"
      )}
      title={isActive ? "Ocultar de la tienda" : "Mostrar en la tienda"}
    >
      {loading ? (
        <Loader2 size={13} className="animate-spin" />
      ) : isActive ? (
        <>
          <EyeOff size={13} /> Ocultar
        </>
      ) : (
        <>
          <Eye size={13} /> Mostrar
        </>
      )}
    </button>
  );
}
