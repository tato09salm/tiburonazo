"use client";

import { useState } from "react";
import { createUser } from "@/actions/admin.actions";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function UserForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "VENDEDOR" as "ADMIN" | "VENDEDOR" | "CLIENTE" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const update = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await createUser(form);
      setSuccess(true);
      setForm({ name: "", email: "", password: "", role: "VENDEDOR" });
      setTimeout(() => { setSuccess(false); router.refresh(); }, 1500);
    } catch {
      setError("Este correo ya está registrado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {[
        { label: "Nombre", key: "name", type: "text", placeholder: "Nombre completo" },
        { label: "Email", key: "email", type: "email", placeholder: "correo@ejemplo.com" },
        { label: "Contraseña", key: "password", type: "password", placeholder: "Mínimo 6 caracteres" },
      ].map(({ label, key, type, placeholder }) => (
        <div key={key}>
          <label className="block text-xs font-semibold text-gray-600 mb-1">{label} *</label>
          <input type={type} value={form[key as keyof typeof form]} onChange={update(key)} required className="input text-sm" placeholder={placeholder} />
        </div>
      ))}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Rol *</label>
        <select value={form.role} onChange={update("role")} className="input text-sm">
          <option value="CLIENTE">Cliente</option>
          <option value="VENDEDOR">Vendedor</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button type="submit" disabled={loading} className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm ${success ? "bg-green-500 text-white" : "btn-primary"}`}>
        {loading ? <Loader2 size={16} className="animate-spin" /> : success ? "✓ Creado" : "Crear usuario"}
      </button>
    </form>
  );
}
