import { z } from "zod";

export const userSchema = z.object({
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres").optional().or(z.literal("")),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres").optional().or(z.literal("")),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  role: z.enum(["ADMIN", "VENDEDOR", "CLIENTE"]),
});

// Inferimos el tipo de datos a partir del esquema
export type UserFormData = z.infer<typeof userSchema>;