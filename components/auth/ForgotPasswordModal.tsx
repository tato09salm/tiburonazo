"use client";

import { useState, useEffect } from "react";
import { sendPasswordResetCode, validateResetCode, resetPassword } from "@/actions/auth.actions";
import { X, Mail, Key, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onClose: () => void;
}

export function ForgotPasswordModal({ onClose }: Props) {
  const [step, setStep] = useState<"EMAIL" | "CODE" | "PASSWORD" | "SUCCESS">("EMAIL");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await sendPasswordResetCode(email);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setStep("CODE");
      setTimer(600); // 10 minutos
    }
  }

  async function handleValidateCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await validateResetCode(email, code);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setStep("PASSWORD");
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setLoading(true);
    setError("");

    const res = await resetPassword(email, code, newPassword);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setStep("SUCCESS");
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Key size={22} className="text-[#11ABC4]" />
            Recuperar Contraseña
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          {step === "EMAIL" && (
            <form onSubmit={handleSendEmail} className="space-y-6">
              <div className="text-center space-y-2 mb-6">
                <div className="w-16 h-16 bg-[#CCECFB] text-[#11ABC4] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail size={32} />
                </div>
                <p className="text-gray-600 text-sm">
                  Ingresa tu correo electrónico para recibir un código de recuperación de 6 dígitos.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Correo electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.toLowerCase())}
                  required
                  className="input"
                  placeholder="tu@correo.com"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl text-sm border border-red-100">
                  <AlertCircle size={18} className="shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="btn-primary w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : "Enviar Código"}
              </button>
            </form>
          )}

          {step === "CODE" && (
            <form onSubmit={handleValidateCode} className="space-y-6">
              <div className="text-center space-y-2 mb-6">
                <div className="w-16 h-16 bg-[#CCECFB] text-[#11ABC4] rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck size={32} />
                </div>
                <p className="text-gray-600 text-sm">
                  Hemos enviado un código a <span className="font-bold text-gray-800">{email}</span>.
                </p>
                {timer > 0 ? (
                  <p className="text-[#11ABC4] font-bold text-lg">Expira en: {formatTime(timer)}</p>
                ) : (
                  <p className="text-red-500 font-bold">El código ha expirado</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 text-center">Código de 6 dígitos</label>
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  required
                  className="input text-center text-2xl tracking-[0.5em] font-bold h-14"
                  placeholder="000000"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl text-sm border border-red-100">
                  <AlertCircle size={18} className="shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={loading || code.length !== 6 || timer === 0}
                  className="btn-primary w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : "Validar Código"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("EMAIL")}
                  className="text-gray-500 text-sm hover:underline"
                >
                  Regresar a ingresar correo
                </button>
              </div>
            </form>
          )}

          {step === "PASSWORD" && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="text-center space-y-2 mb-6">
                <div className="w-16 h-16 bg-[#CCECFB] text-[#11ABC4] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Key size={32} />
                </div>
                <p className="text-gray-600 text-sm">
                  Código verificado. Ahora ingresa tu nueva contraseña.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nueva contraseña</label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="input pr-10"
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Confirmar contraseña</label>
                  <input
                    type={showPass ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="input"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl text-sm border border-red-100">
                  <AlertCircle size={18} className="shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !newPassword || !confirmPassword}
                className="btn-primary w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : "Cambiar Contraseña"}
              </button>
            </form>
          )}

          {step === "SUCCESS" && (
            <div className="text-center space-y-6 py-4">
              <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={48} />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-bold text-gray-800">¡Contraseña actualizada!</h4>
                <p className="text-gray-500">
                  Tu contraseña ha sido restablecida correctamente. Ahora puedes iniciar sesión con tu nueva contraseña.
                </p>
              </div>
              <button
                onClick={onClose}
                className="btn-primary w-full py-3.5 rounded-xl font-bold"
              >
                Ir al Inicio de Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
