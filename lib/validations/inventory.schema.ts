// lib/validations/inventory.schema.ts
import * as z from "zod";

const singleMoveSchema = z.object({
  variantId: z.string().min(1, "Selecciona un producto"),
  quantity: z.number().min(1, "Mínimo 1"),
});

// En tu archivo de esquema
export const inventorySchema = z.object({
  type: z.enum(["ENTRADA", "SALIDA"] as const),
  reason: z.string().min(1, "Selecciona un motivo"),
  note: z.string().optional(),
  items: z.array(
    z.object({
      variantId: z.string().min(1, "Selecciona un producto"),
      quantity: z.number().min(1, "Mínimo 1"),
    })
  ).min(1, "Debes agregar al menos un producto"),
});

export type InventoryFormValues = z.infer<typeof inventorySchema>;