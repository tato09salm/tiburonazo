import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface PriceDisplayProps {
  price: number;
  oldPrice?: number | null;
  // Añadimos "xl" aquí
  size?: "sm" | "md" | "lg" | "xl"; 
  className?: string;
}

export function PriceDisplay({ price, oldPrice, size = "md", className }: PriceDisplayProps) {
  const sizeMap = {
    sm: { current: "text-base font-bold", old: "text-xs" },
    md: { current: "text-lg font-bold", old: "text-sm" },
    lg: { current: "text-2xl font-bold", old: "text-base" },
    // Añadimos la configuración para xl
    xl: { current: "text-3xl font-extrabold", old: "text-lg" }, 
  };

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {oldPrice && oldPrice > price ? (
        <>
          {/* Usamos el operador de encadenamiento opcional ?. por seguridad */}
          <span className={cn("text-gray-400 line-through", sizeMap[size]?.old)}>
            {formatPrice(oldPrice)}
          </span>
          <span className={cn("text-red-500", sizeMap[size]?.current)}>
            {formatPrice(price)}
          </span>
        </>
      ) : (
        <span className={cn("text-[#11ABC4]", sizeMap[size]?.current)}>
          {formatPrice(price)}
        </span>
      )}
    </div>
  );
}