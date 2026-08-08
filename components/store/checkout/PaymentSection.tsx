"use client";

import { useState } from "react";
import { ChevronLeft, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createOrder } from "@/actions/order.actions";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { YapeForm } from "./YapeForm";
import { CardPaymentForm } from "./CardPaymentForm";

export const PaymentSection = ({
  formData,
  ubigeo,
  paymentMethod,
  setPaymentMethod,
  onBack,
  total,
  shippingCost,
  items,
}: any) => {
  const [openAccordion, setOpenAccordion] = useState<"CARD" | "YAPE" | null>(null);
  const [paymentResult, setPaymentResult] = useState<{ status: string; id?: string; error?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCardValid, setIsCardValid] = useState(false);
  const [isYapeValid, setIsYapeValid] = useState(false);

  const router = useRouter();
  const { clearCart } = useCart();
  const finalTotal = total + shippingCost;

  const isFormValid = openAccordion === "CARD" ? isCardValid : (openAccordion === "YAPE" ? isYapeValid : false);

  const handlePaymentResult = async (result: { status: string; id?: string; error?: string }) => {
    setPaymentResult(result);

    if ((result.status === "approved" || result.status === "processed") && result.id) {
      try {
        await createOrder({
          ...formData,
          ubigeo,
          paymentMethod: openAccordion === "YAPE" ? "YAPE" : "MERCADO_PAGO",
          mercadopagoPaymentId: result.id,
          shippingCost,
          total: finalTotal,
          items: items.map((i: any) => ({ variantId: i.variantId, quantity: i.quantity, price: i.price })),
        });
        clearCart();
      } catch (error) {
        console.error("Error creating order:", error);
        setPaymentResult({ status: "error", error: "Error al crear la orden. El pago fue procesado." });
      }
    }
  };

  const toggleAccordion = (method: "CARD" | "YAPE") => {
    if (openAccordion === method) {
      setOpenAccordion(null);
    } else {
      setOpenAccordion(method);
      setPaymentMethod(method);
    }
  };

  const handleGlobalSubmit = () => {
    if (!openAccordion) return;
    setLoading(true);
    if (openAccordion === "CARD") {
      const cardForm = document.getElementById("form-checkout") as HTMLFormElement;
      if (cardForm) {
        cardForm.requestSubmit();
      }
    } else {
      // Trigger Yape Form
      const yapeBtn = document.getElementById("trigger-yape-submit");
      if (yapeBtn) yapeBtn.click();
    }
    setTimeout(() => setLoading(false), 2000);
  };

  if (paymentResult) {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="bg-white p-8 rounded-2xl border shadow-sm text-center">
          {paymentResult.status === "approved" || paymentResult.status === "processed" ? (
            <>
              <CheckCircle className="mx-auto text-green-500 mb-4" size={64} />
              <h2 className="text-xl font-bold text-gray-900 mb-2">¡Pago Aprobado!</h2>
              <p className="text-gray-500 mb-6">
                Tu pago ha sido procesado exitosamente. Tu orden ha sido creada.
              </p>
              {paymentResult.id && (
                <p className="text-xs text-gray-400 mb-6">
                  ID de transacción: {paymentResult.id}
                </p>
              )}
              <button
                onClick={() => router.push("/cuenta?success=1")}
                className="btn-primary w-full py-4 rounded-2xl font-bold"
              >
                Ver mi orden
              </button>
            </>
          ) : (
            <>
              <XCircle className="mx-auto text-red-500 mb-4" size={64} />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Pago No Completado</h2>
              <p className="text-gray-500 mb-4">
                {paymentResult.error || "El pago no pudo ser procesado. Por favor, intenta con otro método."}
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => setPaymentResult(null)}
                  className="btn-primary w-full py-4 rounded-2xl font-bold"
                >
                  Intentar nuevamente
                </button>
                <button
                  onClick={() => router.push("/carrito")}
                  className="w-full py-3 text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  Volver al carrito
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#11ABC4] transition-colors">
        <ChevronLeft size={18} /> Editar datos de envío
      </button>

      {/* Directo en el fondo de la pantalla */}
      <div className="space-y-4">
        {/* Título de Sección con Jerarquía */}
        <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-wide uppercase mb-3">
          MÉTODO DE PAGO
        </h2>

        {/* ACORDEÓN 1: TARJETA DE CRÉDITO / DÉBITO */}
        <div
          className={cn(
            "bg-white rounded-xl transition-all overflow-hidden border",
            openAccordion === "CARD" ? "border-[#11ABC4] ring-1 ring-[#11ABC4]" : "border-gray-200"
          )}
        >
          <button
            type="button"
            onClick={() => toggleAccordion("CARD")}
            className="w-full flex items-center justify-between p-5 bg-white text-left cursor-pointer"
          >
            <span className="font-bold text-sm sm:text-base text-gray-800 tracking-wide uppercase">
              TARJETA DE CRÉDITO / DÉBITO
            </span>

            {/* Badges / Logos de Tarjetas */}
            <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
              <span className="text-[10px] font-black italic text-[#1A1F71] tracking-tighter">VISA</span>
              <div className="flex -space-x-1 items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[#EB001B]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#F79E1B]/80"></div>
              </div>
              <span className="text-[9px] font-extrabold text-[#006FCF] bg-[#006FCF]/10 px-1 rounded">AMEX</span>
              <span className="hidden sm:inline text-[9px] font-bold text-gray-500">DINERS</span>
            </div>
          </button>

          {/* Contenido Acordeón Tarjeta */}
          {openAccordion === "CARD" && (
            <div className="px-5 pb-6 bg-white animate-in fade-in duration-150">
              <p className="text-xs text-gray-500 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                Es posible que se abra la ventana del sistema 3D Secure de tu banco para verificar tus datos.
              </p>
              <CardPaymentForm
                total={finalTotal}
                onPaymentResult={handlePaymentResult}
                onBack={onBack}
                onValidityChange={setIsCardValid}
              />
            </div>
          )}
        </div>

        {/* ACORDEÓN 2: YAPE */}
        <div
          className={cn(
            "bg-white rounded-xl transition-all overflow-hidden border",
            openAccordion === "YAPE" ? "border-[#11ABC4] ring-1 ring-[#11ABC4]" : "border-gray-200"
          )}
        >
          <button
            type="button"
            onClick={() => toggleAccordion("YAPE")}
            className="w-full flex items-center justify-between p-5 bg-white text-left cursor-pointer"
          >
            <span className="font-bold text-sm sm:text-base text-gray-800 tracking-wide uppercase">
              YAPE
            </span>

            {/* Badge de Yape */}
            <div className="bg-[#742284] text-white px-2.5 py-0.5 rounded-md font-extrabold text-[11px] tracking-wide">
              yape
            </div>
          </button>

          {/* Contenido Acordeón Yape */}
          {openAccordion === "YAPE" && (
            <div className="px-5 pb-6 bg-white animate-in fade-in duration-150">
              <YapeForm
                total={finalTotal}
                onPaymentResult={handlePaymentResult}
                onBack={onBack}
                onValidityChange={setIsYapeValid}
              />
            </div>
          )}
        </div>

        {/* ÚNICO BOTÓN GLOBAL DE 'HACER PEDIDO' (1/4 de su ancho, alineado a la izquierda) */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleGlobalSubmit}
            disabled={loading || !isFormValid}
            className="w-full sm:w-1/4 py-3.5 rounded-xl font-bold text-white bg-[#11ABC4] hover:bg-[#0d8fa6] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-md shadow-[#11ABC4]/20 text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Procesando...
              </>
            ) : (
              "Hacer pedido"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
