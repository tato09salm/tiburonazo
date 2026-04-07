"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { createUser } from "@/actions/admin.actions";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) { setError("Las contraseñas no coinciden"); return; }
    if (form.password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
    setLoading(true);
    setError("");
    try {
      await createUser({ name: form.name, email: form.email, password: form.password, role: "CLIENTE" });
      await signIn("credentials", { email: form.email, password: form.password, redirect: false });
      router.push("/");
    } catch {
      setError("Este correo ya está registrado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8fbff] to-[#CCECFB] px-4 py-12">
      <div className="card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="font-heading text-2xl font-bold mt-4 text-gray-800">Crear cuenta</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: "Nombre completo", key: "name", type: "text", placeholder: "Tu nombre" },
            { label: "Correo electrónico", key: "email", type: "email", placeholder: "tu@correo.com" },
            { label: "Contraseña", key: "password", type: "password", placeholder: "Mínimo 6 caracteres" },
            { label: "Confirmar contraseña", key: "confirm", type: "password", placeholder: "Repite tu contraseña" },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
              <input type={type} value={form[key as keyof typeof form]} onChange={update(key)} required className="input" placeholder={placeholder} />
            </div>
          ))}

          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><UserPlus size={18} /> Registrarse</>}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿Ya tienes cuenta? <Link href="/login" className="text-[#11ABC4] font-semibold hover:underline">Ingresar</Link>
        </p>
      </div>
    </div>
  );
}
