"use client";

import { useEffect, useState } from "react";
import { Smartphone, Loader2, Eye, EyeOff } from "lucide-react";

interface YapeFormProps {
  total: number;
  onPaymentResult: (result: { status: string; id?: string; error?: string }) => void;
  onBack: () => void;
  onValidityChange?: (isValid: boolean) => void;
}

export const YapeForm = ({ total, onPaymentResult, onBack, onValidityChange }: YapeFormProps) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);

  const isFormValid = phoneNumber.length === 9 && otp.length === 6;

  useEffect(() => {
    onValidityChange?.(isFormValid);
  }, [isFormValid, onValidityChange]);

  const handlePayment = async () => {
    if (!phoneNumber || phoneNumber.length !== 9) {
      onPaymentResult({ status: "error", error: "El número de celular debe tener 9 dígitos" });
      return;
    }
    if (!otp || otp.length !== 6) {
      onPaymentResult({ status: "error", error: "El código OTP debe tener 6 dígitos" });
      return;
    }

    setLoading(true);

    try {
      const { loadMercadoPago } = await import("@mercadopago/sdk-js");
      const MercadoPago = await loadMercadoPago() as any;
      const mpInstance = new MercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY!);

      const yapeToken = await mpInstance.yape({
        otp,
        phoneNumber,
      }).create();

      if (!yapeToken) {
        onPaymentResult({ status: "error", error: "No se pudo generar el token de Yape" });
        setLoading(false);
        return;
      }

      const res = await fetch("/api/mercadopago/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: yapeToken.id,
          transactionAmount: total,
          paymentMethodId: "yape",
          installments: 1,
          description: "Compra en Tiburonazo - Yape",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        onPaymentResult({ status: "error", error: data.error || "Error al procesar el pago con Yape" });
        setLoading(false);
        return;
      }

      onPaymentResult({ status: data.status, id: data.id });
    } catch (error: any) {
      console.error("Yape payment error:", error);
      onPaymentResult({
        status: "error",
        error: error?.message || "Error al procesar el pago con Yape",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Número de celular (9 dígitos) <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 9))}
          placeholder="912345678"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#11ABC4] focus:ring-2 focus:ring-[#11ABC4]/20 outline-none text-sm font-mono"
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Código OTP de Yape (6 dígitos) <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type={showOtp ? "text" : "password"}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 focus:border-[#11ABC4] focus:ring-2 focus:ring-[#11ABC4]/20 outline-none text-sm font-mono"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowOtp(!showOtp)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showOtp ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          En Yape ve a "Mi Yape" → "Código de aprobación"
        </p>
      </div>

      <button
        id="trigger-yape-submit"
        type="button"
        onClick={handlePayment}
        className="hidden"
      />
    </div>
  );
};
