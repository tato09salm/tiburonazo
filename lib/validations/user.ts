import { z } from "zod";

export const userSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  role: z.enum(["ADMIN", "VENDEDOR", "CLIENTE"]),
});

// Inferimos el tipo de datos a partir del esquema
export type UserFormData = z.infer<typeof userSchema>;