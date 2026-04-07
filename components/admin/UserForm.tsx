"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUser } from "@/actions/admin.actions";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { userSchema, type UserFormData } from "@/lib/validations/user";

export function UserForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: { role: "VENDEDOR" },
  });

  async function onSubmit(data: UserFormData) {
    setLoading(true);
    setServerError("");
    try {
      await createUser(data);
      setSuccess(true);
      reset(); // Limpia el formulario
      setTimeout(() => {
        setSuccess(false);
        router.refresh();
      }, 1500);
    } catch (err) {
      setServerError("Este correo ya está registrado o hubo un error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      {/* Campo Nombre */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre *</label>
        <input 
          {...register("name")} 
          className={`input text-sm ${errors.name ? "border-red-500" : ""}`} 
          placeholder="Nombre completo" 
        />
        {errors.name && <p className="text-[10px] text-red-500 mt-1">{errors.name.message}</p>}
      </div>

      {/* Campo Email */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
        <input 
          {...register("email")} 
          type="email" 
          className={`input text-sm ${errors.email ? "border-red-500" : ""}`} 
          placeholder="correo@ejemplo.com" 
        />
        {errors.email && <p className="text-[10px] text-red-500 mt-1">{errors.email.message}</p>}
      </div>

      {/* Campo Contraseña */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Contraseña *</label>
        <input 
          {...register("password")} 
          type="password" 
          className={`input text-sm ${errors.password ? "border-red-500" : ""}`} 
          placeholder="Mínimo 8 caracteres" 
        />
        {errors.password && <p className="text-[10px] text-red-500 mt-1">{errors.password.message}</p>}
      </div>

      {/* Campo Rol */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Rol *</label>
        <select {...register("role")} className="input text-sm">
          <option value="CLIENTE">Cliente</option>
          <option value="VENDEDOR">Vendedor</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {serverError && <p className="text-xs text-red-500">{serverError}</p>}

      <button 
        type="submit" 
        disabled={loading} 
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
          success ? "bg-green-500 text-white" : "btn-primary"
        }`}
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : success ? "✓ Creado" : "Crear usuario"}
      </button>
    </form>
  );
}