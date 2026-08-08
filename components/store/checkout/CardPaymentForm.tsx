"use client";

import { useEffect, useState } from "react";
import { CreditCard, Eye, EyeOff, Loader2, ShieldCheck, Lock, CreditCard as CardIcon } from "lucide-react";

interface CardPaymentFormProps {
  total: number;
  onPaymentResult: (result: { status: string; id?: string; error?: string }) => void;
  onBack: () => void;
  onValidityChange?: (isValid: boolean) => void;
}

export const CardPaymentForm = ({ total, onPaymentResult, onBack, onValidityChange }: CardPaymentFormProps) => {
  const [loading, setLoading] = useState(false);
  const [mpInstance, setMpInstance] = useState<any>(null);
  const [identificationTypes, setIdentificationTypes] = useState<any[]>([]);
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [issuerId, setIssuerId] = useState("");
  const [installments, setInstallments] = useState<any[]>([]);

  // Form State
  const [cardNumber, setCardNumber] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [expirationDate, setExpirationDate] = useState(""); // Formato MM/AA
  const [securityCode, setSecurityCode] = useState("");
  const [identificationType, setIdentificationType] = useState("");
  const [identificationNumber, setIdentificationNumber] = useState("");
  const [selectedInstallments, setSelectedInstallments] = useState("1");
  const [email, setEmail] = useState("");
  const [showCVV, setShowCVV] = useState(false);

  // Card Type info & CVV max length (AMEX uses 4, standard uses 3)
  const [cardBrand, setCardBrand] = useState<string>("");
  const [maxCvvLength, setMaxCvvLength] = useState<number>(3);

  // Validation Errors State
  const [errors, setErrors] = useState<{
    cardNumber?: string;
    expirationDate?: string;
    securityCode?: string;
    cardholderName?: string;
    email?: string;
    identificationType?: string;
    identificationNumber?: string;
  }>({});

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const initMercadoPago = async () => {
      try {
        const { loadMercadoPago } = await import("@mercadopago/sdk-js");
        const MercadoPago = (await loadMercadoPago()) as any;
        const mp = new MercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY!);
        setMpInstance(mp);

        const identTypes = await mp.getIdentificationTypes();
        setIdentificationTypes(identTypes);
        if (identTypes.length > 0) {
          setIdentificationType(identTypes[0].id);
        }
      } catch (e) {
        console.error("Error initializing MercadoPago:", e);
      }
    };

    initMercadoPago();
  }, []);

  // Detect card brand and config
  useEffect(() => {
    if (!mpInstance) return;

    const detectPaymentMethod = async () => {
      const cleanNumber = cardNumber.replace(/\s/g, "");
      if (cleanNumber.length >= 6) {
        try {
          const bin = cleanNumber.substring(0, 6);
          const { results } = await mpInstance.getPaymentMethods({ bin });
          if (results && results.length > 0) {
            const paymentMethod = results[0];
            setPaymentMethodId(paymentMethod.id);
            setCardBrand(paymentMethod.name || paymentMethod.id);

            // AMEX typically requires 4 digits CVV
            if (paymentMethod.id === "amex") {
              setMaxCvvLength(4);
            } else {
              setMaxCvvLength(3);
              if (securityCode.length > 3) {
                setSecurityCode(securityCode.slice(0, 3));
              }
            }

            const { additional_info_needed, issuer } = paymentMethod;
            let issuerOptions = [issuer];

            if (additional_info_needed?.includes("issuer_id")) {
              const issuers = await mpInstance.getIssuers({
                paymentMethodId: paymentMethod.id,
                bin,
              });
              issuerOptions = issuers;
            }
            if (issuerOptions.length > 0 && issuerOptions[0]) {
              setIssuerId(issuerOptions[0].id);
            }

            const installmentsList = await mpInstance.getInstallments({
              bin,
              amount: String(total),
            });
            if (installmentsList.length > 0) {
              setInstallments(installmentsList[0].payer_costs || []);
            }
          }
        } catch (e) {
          console.error("Error getting payment methods:", e);
        }
      } else {
        setPaymentMethodId("");
        setCardBrand("");
        setIssuerId("");
        setInstallments([]);
        setMaxCvvLength(3);
      }
    };

    detectPaymentMethod();
  }, [cardNumber, mpInstance, total]);

  // Luhn algorithm for card validation ("La tarjeta no es válida")
  const validateLuhn = (numStr: string) => {
    let sum = 0;
    let isEven = false;
    for (let i = numStr.length - 1; i >= 0; i--) {
      let digit = parseInt(numStr.charAt(i), 10);
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isEven = !isEven;
    }
    return sum % 10 === 0;
  };

  // Card formatting: numbers only, formatted into groups of 4 (or 4-6-5 for amex)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, ""); // Solo permitir números
    if (rawVal.length > 19) return;

    let formatted = rawVal;
    if (rawVal.length > 0) {
      const parts = rawVal.match(/.{1,4}/g);
      if (parts) {
        formatted = parts.join(" ");
      }
    }
    setCardNumber(formatted);

    // Validate on change if touched
    validateField("cardNumber", formatted);
  };

  // Expiration Date formatting MM/AA
  const handleExpirationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawVal = e.target.value.replace(/\D/g, ""); // Solo números
    if (rawVal.length > 4) rawVal = rawVal.slice(0, 4);

    let formatted = rawVal;
    if (rawVal.length >= 3) {
      formatted = `${rawVal.slice(0, 2)}/${rawVal.slice(2)}`;
    } else if (rawVal.length === 2 && e.nativeEvent.inputType !== "deleteContentBackward") {
      formatted = `${rawVal}/`;
    }

    setExpirationDate(formatted);
    validateField("expirationDate", formatted);
  };

  // CVV input handler
  const handleCVVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, "").slice(0, maxCvvLength);
    setSecurityCode(rawVal);
    validateField("securityCode", rawVal);
  };

  const validateField = (field: string, val?: string) => {
    const newErrors = { ...errors };

    if (field === "cardNumber") {
      const value = val !== undefined ? val : cardNumber;
      const cleanNum = value.replace(/\s/g, "");

      if (!cleanNum) {
        newErrors.cardNumber = "Es requerida";
      } else if (cleanNum.length < 14 || cleanNum.length > 19) {
        newErrors.cardNumber = "Ingrese un valor entre 14 y 19 caracteres";
      } else if (!validateLuhn(cleanNum)) {
        newErrors.cardNumber = "La tarjeta no es válida";
      } else {
        delete newErrors.cardNumber;
      }
    }

    if (field === "expirationDate") {
      const value = val !== undefined ? val : expirationDate;
      const cleanVal = value.replace(/\D/g, "");

      if (!value || cleanVal.length < 4) {
        newErrors.expirationDate = "Fecha incompleta";
      } else {
        const month = parseInt(cleanVal.slice(0, 2), 10);
        const year = parseInt(`20${cleanVal.slice(2, 4)}`, 10);

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        if (month < 1 || month > 12) {
          newErrors.expirationDate = "Mes inválido";
        } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
          newErrors.expirationDate = "Tarjeta vencida";
        } else {
          delete newErrors.expirationDate;
        }
      }
    }

    if (field === "securityCode") {
      const value = val !== undefined ? val : securityCode;
      if (!value) {
        newErrors.securityCode = "Código requerido";
      } else if (value.length < maxCvvLength) {
        newErrors.securityCode = `Debe tener ${maxCvvLength} dígitos`;
      } else {
        delete newErrors.securityCode;
      }
    }

    if (field === "cardholderName") {
      const value = val !== undefined ? val : cardholderName;
      if (!value.trim()) {
        newErrors.cardholderName = "Nombre en la tarjeta es requerido";
      } else {
        delete newErrors.cardholderName;
      }
    }

    if (field === "email") {
      const value = val !== undefined ? val : email;
      if (!value.trim()) {
        newErrors.email = "Correo electrónico requerido";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        newErrors.email = "Ingrese un correo electrónico válido";
      } else {
        delete newErrors.email;
      }
    }

    if (field === "identificationNumber") {
      const value = val !== undefined ? val : identificationNumber;
      if (!value.trim()) {
        newErrors.identificationNumber = "Número de documento requerido";
      } else {
        delete newErrors.identificationNumber;
      }
    }

    setErrors(newErrors);
    return newErrors;
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const validateAll = () => {
    const cleanNum = cardNumber.replace(/\s/g, "");
    const errs: typeof errors = {};

    if (!cleanNum) {
      errs.cardNumber = "Es requerida";
    } else if (cleanNum.length < 14 || cleanNum.length > 19) {
      errs.cardNumber = "Ingrese un valor entre 14 y 19 caracteres";
    } else if (!validateLuhn(cleanNum)) {
      errs.cardNumber = "La tarjeta no es válida";
    }

    const cleanExp = expirationDate.replace(/\D/g, "");
    if (!expirationDate || cleanExp.length < 4) {
      errs.expirationDate = "Fecha incompleta";
    } else {
      const month = parseInt(cleanExp.slice(0, 2), 10);
      const year = parseInt(`20${cleanExp.slice(2, 4)}`, 10);
      const now = new Date();
      if (month < 1 || month > 12) errs.expirationDate = "Mes inválido";
      else if (year < now.getFullYear() || (year === now.getFullYear() && month < (now.getMonth() + 1))) {
        errs.expirationDate = "Tarjeta vencida";
      }
    }

    if (!securityCode) {
      errs.securityCode = "Código requerido";
    } else if (securityCode.length < maxCvvLength) {
      errs.securityCode = `Debe tener ${maxCvvLength} dígitos`;
    }

    if (!cardholderName.trim()) {
      errs.cardholderName = "Nombre en la tarjeta es requerido";
    }

    if (!email.trim()) {
      errs.email = "Correo electrónico requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = "Ingrese un correo electrónico válido";
    }

    if (!identificationNumber.trim()) {
      errs.identificationNumber = "Número de documento requerido";
    }

    setErrors(errs);
    setTouched({
      cardNumber: true,
      expirationDate: true,
      securityCode: true,
      cardholderName: true,
      email: true,
      identificationNumber: true,
    });

    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateAll()) {
      return;
    }

    setLoading(true);

    try {
      if (!mpInstance) {
        onPaymentResult({ status: "error", error: "MercadoPago no está inicializado" });
        setLoading(false);
        return;
      }

      const cleanExp = expirationDate.replace(/\D/g, "");
      const expMonth = cleanExp.slice(0, 2);
      const expYear = cleanExp.slice(2, 4);

      const tokenResponse = await mpInstance.createCardToken({
        cardNumber: cardNumber.replace(/\s/g, ""),
        cardholderName: cardholderName.trim(),
        cardExpirationMonth: expMonth,
        cardExpirationYear: expYear,
        securityCode,
        identificationType,
        identificationNumber: identificationNumber.trim(),
      });

      if (!tokenResponse?.id) {
        onPaymentResult({ status: "error", error: "No se pudo procesar la tarjeta. Verifica los datos." });
        setLoading(false);
        return;
      }

      const finalEmail = email.includes("@") ? email : "cliente@tiburonazo.com";

      const res = await fetch("/api/mercadopago/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: tokenResponse.id,
          transactionAmount: total,
          paymentMethodId: tokenResponse.payment_method_id || paymentMethodId,
          installments: parseInt(selectedInstallments),
          description: "Compra en Tiburonazo",
          payerEmail: finalEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        onPaymentResult({ status: "error", error: data.error || "Error al procesar el pago" });
        setLoading(false);
        return;
      }

      onPaymentResult({ status: data.status, id: data.id });
    } catch (error: any) {
      console.error("Card payment error:", error);
      let errorMessage = "Error al procesar el pago con tarjeta";
      if (Array.isArray(error)) {
        errorMessage = error.map((e: any) => e.description || e.message).join(", ");
      } else if (error?.message) {
        errorMessage = error.message;
      }
      onPaymentResult({ status: "error", error: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    cardNumber.replace(/\s/g, "").length >= 14 &&
    expirationDate.replace(/\D/g, "").length === 4 &&
    securityCode.length >= maxCvvLength &&
    cardholderName.trim().length > 0 &&
    email.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    identificationNumber.trim().length > 0 &&
    Object.keys(errors).length === 0;

  useEffect(() => {
    onValidityChange?.(!!isFormValid);
  }, [isFormValid, onValidityChange]);

  return (
    <form id="form-checkout" onSubmit={handleSubmit} className="space-y-4 pt-2" noValidate>
      {/* Titular de la tarjeta */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Titular de la tarjeta <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={cardholderName}
          onChange={(e) => {
            setCardholderName(e.target.value.toUpperCase());
            validateField("cardholderName", e.target.value);
          }}
          onBlur={() => handleBlur("cardholderName")}
          placeholder="Como figura en la tarjeta"
          className={`w-full px-4 py-3 text-sm rounded-xl border transition-all outline-none uppercase ${
            touched.cardholderName && errors.cardholderName
              ? "border-red-500 bg-red-50/20 focus:ring-2 focus:ring-red-200"
              : "border-gray-200 focus:border-[#11ABC4] focus:ring-2 focus:ring-[#11ABC4]/20"
          }`}
          disabled={loading}
        />
        {touched.cardholderName && errors.cardholderName && (
          <p className="text-xs text-red-500 mt-1 font-medium">{errors.cardholderName}</p>
        )}
      </div>

      {/* Número de tarjeta */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Número de tarjeta <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={cardNumber}
            onChange={handleCardNumberChange}
            onBlur={() => handleBlur("cardNumber")}
            placeholder="XXXX XXXX XXXX XXXX"
            maxLength={23}
            className={`w-full px-4 py-3 text-sm rounded-xl border transition-all outline-none font-mono ${
              touched.cardNumber && errors.cardNumber
                ? "border-red-500 bg-red-50/20 focus:ring-2 focus:ring-red-200"
                : "border-gray-200 focus:border-[#11ABC4] focus:ring-2 focus:ring-[#11ABC4]/20"
            }`}
            disabled={loading}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <CardIcon size={18} />
          </div>
        </div>
        {touched.cardNumber && errors.cardNumber && (
          <p className="text-xs text-red-500 mt-1 font-medium">{errors.cardNumber}</p>
        )}
      </div>

      {/* Expiración & CVV */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            MM / AA <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={expirationDate}
            onChange={handleExpirationChange}
            onBlur={() => handleBlur("expirationDate")}
            placeholder="MM/AA"
            maxLength={5}
            className={`w-full px-4 py-3 text-sm rounded-xl border transition-all outline-none font-mono ${
              touched.expirationDate && errors.expirationDate
                ? "border-red-500 bg-red-50/20 focus:ring-2 focus:ring-red-200"
                : "border-gray-200 focus:border-[#11ABC4] focus:ring-2 focus:ring-[#11ABC4]/20"
            }`}
            disabled={loading}
          />
          {touched.expirationDate && errors.expirationDate ? (
            <p className="text-xs text-red-500 mt-1 font-medium">{errors.expirationDate}</p>
          ) : (
            <p className="text-[11px] text-gray-400 mt-1">Fecha de caducidad de la tarjeta</p>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-semibold text-gray-700">
              CVV <span className="text-red-500">*</span>
            </label>
            <span className="text-[10px] text-gray-400 font-normal">({maxCvvLength} dígitos)</span>
          </div>
          <div className="relative">
            <input
              type={showCVV ? "text" : "password"}
              value={securityCode}
              onChange={handleCVVChange}
              onBlur={() => handleBlur("securityCode")}
              placeholder={maxCvvLength === 4 ? "1234" : "123"}
              maxLength={maxCvvLength}
              className={`w-full px-4 py-3 text-sm rounded-xl border transition-all outline-none font-mono ${
                touched.securityCode && errors.securityCode
                  ? "border-red-500 bg-red-50/20 focus:ring-2 focus:ring-red-200"
                  : "border-gray-200 focus:border-[#11ABC4] focus:ring-2 focus:ring-[#11ABC4]/20"
              }`}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowCVV(!showCVV)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showCVV ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {touched.securityCode && errors.securityCode && (
            <p className="text-xs text-red-500 mt-1 font-medium">{errors.securityCode}</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Correo electrónico <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            validateField("email", e.target.value);
          }}
          onBlur={() => handleBlur("email")}
          placeholder="ejemplo@correo.com"
          className={`w-full px-4 py-3 text-sm rounded-xl border transition-all outline-none ${
            touched.email && errors.email
              ? "border-red-500 bg-red-50/20 focus:ring-2 focus:ring-red-200"
              : "border-gray-200 focus:border-[#11ABC4] focus:ring-2 focus:ring-[#11ABC4]/20"
          }`}
          disabled={loading}
        />
        {touched.email && errors.email && (
          <p className="text-xs text-red-500 mt-1 font-medium">{errors.email}</p>
        )}
      </div>

      {/* Tipo & Número de Documento */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Tipo de Doc. <span className="text-red-500">*</span>
          </label>
          <select
            value={identificationType}
            onChange={(e) => setIdentificationType(e.target.value)}
            className="w-full px-3 py-3 text-sm rounded-xl border border-gray-200 focus:border-[#11ABC4] focus:ring-2 focus:ring-[#11ABC4]/20 outline-none bg-white font-medium"
            disabled={loading || identificationTypes.length === 0}
          >
            {identificationTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            N° de Documento <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={identificationNumber}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "");
              setIdentificationNumber(val);
              validateField("identificationNumber", val);
            }}
            onBlur={() => handleBlur("identificationNumber")}
            placeholder="12345678"
            className={`w-full px-4 py-3 text-sm rounded-xl border transition-all outline-none ${
              touched.identificationNumber && errors.identificationNumber
                ? "border-red-500 bg-red-50/20 focus:ring-2 focus:ring-red-200"
                : "border-gray-200 focus:border-[#11ABC4] focus:ring-2 focus:ring-[#11ABC4]/20"
            }`}
            disabled={loading}
          />
          {touched.identificationNumber && errors.identificationNumber && (
            <p className="text-xs text-red-500 mt-1 font-medium">{errors.identificationNumber}</p>
          )}
        </div>
      </div>

      {/* Cuotas si aplican */}
      {installments.length > 1 && (
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Cuotas</label>
          <select
            value={selectedInstallments}
            onChange={(e) => setSelectedInstallments(e.target.value)}
            className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 focus:border-[#11ABC4] focus:ring-2 focus:ring-[#11ABC4]/20 outline-none bg-white font-medium"
            disabled={loading}
          >
            {installments.map((inst) => (
              <option key={inst.installments} value={inst.installments}>
                {inst.installments} cuota(s) - {inst.recommended_message}
              </option>
            ))}
          </select>
        </div>
      )}
    </form>
  );
};

