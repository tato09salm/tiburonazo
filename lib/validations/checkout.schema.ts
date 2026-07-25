import { z } from "zod";

export const checkoutSchema = z.object({
    deliveryMethod: z.enum(["SHIPPING", "PICKUP"]),
    document: z.string().regex(/^(?:\d{8}|\d{11})$/, "Debe ser un DNI (8 dígitos) o RUC (11 dígitos) válido"),

    // Campos para despacho a domicilio
    addressId: z.string().optional(),

    // Campos para recojo en tienda
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
}).superRefine((data, ctx) => {
    // Validaciones estrictas si elige envío a domicilio
    if (data.deliveryMethod === "SHIPPING") {
        if (!data.addressId || data.addressId.trim() === "") {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Debes seleccionar una dirección de envío",
                path: ["addressId"],
            });
        }
    }

    // Validaciones estrictas si elige recojo en tienda
    if (data.deliveryMethod === "PICKUP") {
        if (!data.firstName || data.firstName.trim().length < 2) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "El nombre debe tener al menos 2 caracteres",
                path: ["firstName"],
            });
        }
        if (!data.lastName || data.lastName.trim().length < 2) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "El apellido debe tener al menos 2 caracteres",
                path: ["lastName"],
            });
        }
        if (!data.phone || !/^9\d{8}$/.test(data.phone)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Debe ser un número celular válido (9 dígitos)",
                path: ["phone"],
            });
        }
    }
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;