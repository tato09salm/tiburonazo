"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Quote } from "lucide-react";
import { createUser } from "@/actions/admin.actions";
import { loginWithGoogle } from "@/actions/auth.actions";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) { setError("Las contraseñas no coinciden"); return; }
    if (form.password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres"); return; }
    setLoading(true);
    setError("");
    try {
      await createUser({ email: form.email, password: form.password, role: "CLIENTE" });
      await signIn("credentials", { email: form.email, password: form.password, redirect: false });
      router.push("/");
    } catch {
      setError("Este correo ya está registrado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-screen w-full bg-[#f8fbff] text-slate-800 flex overflow-hidden">
      <div className="w-full h-full grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Form Column */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white p-6 sm:p-8 lg:p-10 flex flex-col justify-between border-r border-slate-100 shadow-sm overflow-y-auto">
          <div className="w-full max-w-sm mx-auto my-auto py-2">
            {/* Logo */}
            <div className="mb-6">
              <Link href="/" className="inline-flex items-center gap-2">
                <Image
                  src="/logo.png"
                  alt="Tiburonazo Logo"
                  width={160}
                  height={46}
                  className="object-contain"
                  priority
                />
              </Link>
            </div>

            {/* Title */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-heading">Crea tu cuenta</h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">Empieza a comprar</p>
            </div>

            {/* Google OAuth Button */}
            <form action={async () => { await loginWithGoogle("/"); }}>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium py-2.5 px-4 rounded-xl transition-all text-sm mb-4 shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Registrarse con Google
              </button>
            </form>

            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <span className="relative bg-white px-3 text-xs text-slate-400 font-medium">o</span>
            </div>

            {/* Credentials Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Correo electrónico</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={update("email")}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#11ABC4] focus:ring-1 focus:ring-[#11ABC4] transition-all"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Contraseña</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={update("password")}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#11ABC4] focus:ring-1 focus:ring-[#11ABC4] transition-all"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Confirmar contraseña</label>
                <input
                  type="password"
                  value={form.confirm}
                  onChange={update("confirm")}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#11ABC4] focus:ring-1 focus:ring-[#11ABC4] transition-all"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3 rounded-xl flex items-center gap-2">
                  <ShieldCheck size={16} className="shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#11ABC4] hover:bg-[#0d8fa6] text-white font-semibold py-2.5 px-4 rounded-xl transition-all text-sm mt-4 flex items-center justify-center gap-2 shadow-md shadow-[#11ABC4]/20"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Crear cuenta"
                )}
              </button>
            </form>

            {/* Login link */}
            <p className="text-center text-xs text-slate-500 mt-5">
              ¿Ya tienes una cuenta?{" "}
              <Link href="/login" className="text-[#11ABC4] hover:underline font-bold">
                Iniciar sesión
              </Link>
            </p>

            <p className="text-[11px] text-slate-400 text-center mt-5 leading-relaxed">
              Al registrarte, aceptas nuestros Términos de Servicio y la Política de Privacidad de Tiburonazo.
            </p>
          </div>
        </div>

        {/* Right Testimonial Section */}
        <div className="hidden lg:col-span-7 xl:col-span-8 bg-[#EEF8FC] p-10 lg:p-16 lg:flex flex-col justify-center relative overflow-hidden">
          {/* Decorative soft circles */}
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#CCECFB]/60 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#00D4DD]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-xl mx-auto space-y-6 relative z-10">
            <Quote className="w-14 h-14 text-[#11ABC4]/40" />
            <blockquote className="text-2xl lg:text-3xl font-bold text-slate-800 leading-relaxed tracking-tight font-heading">
              "¡Increíble variedad de productos acuáticos! Registrarme me tomó segundos y el proceso de compra fue súper fluido."
            </blockquote>
            <div className="flex items-center gap-4 pt-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#11ABC4] to-[#00D4DD] flex items-center justify-center font-bold text-white text-lg shadow-md shadow-[#11ABC4]/20">
                ML
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm sm:text-base">María López</p>
                <p className="text-xs text-[#0d8fa6] font-medium">@maria_natacion</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
