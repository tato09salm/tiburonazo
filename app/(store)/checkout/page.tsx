"use client";

import { useState, useEffect, useMemo } from "react";
import { useCart } from "@/hooks/useCart";
import { useSession } from "next-auth/react";
import { StepIndicator } from "@/components/store/checkout/StepIndicator";
import { UbigeoSelects } from "@/components/store/checkout/UbigeoSelects";
import { OrderSummary } from "@/components/store/checkout/OrderSummary";
import { PaymentSection } from "@/components/store/checkout/PaymentSection";
import { calculateShippingCost } from "@/lib/shipping-service";
import { User, MapPin, Store, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CheckoutPage() {
  const { items, total } = useCart();
  const { data: session } = useSession();
  
  const [currentStep, setCurrentStep] = useState(1); 
  const [deliveryMethod, setDeliveryMethod] = useState<"PICKUP" | "SHIPPING">("SHIPPING");
  const [paymentMethod, setPaymentMethod] = useState("CULQI");
  
  const [ubigeo, setUbigeo] = useState({ dept: "", prov: "", dist: "" });
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", document: "", phone: "", address: "", reference: ""
  });

  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const totalWeight = useMemo(() => items.reduce((acc, item) => acc + (0.2 * item.quantity), 0), [items]);

  useEffect(() => {
    if (session?.user) {
      const u = session.user as any;
      setFormData(prev => ({
        ...prev,
        firstName: u.name || "", lastName: u.lastName || "",
        phone: u.phone || "", address: u.address || "", reference: u.reference || ""
      }));
    }
  }, [session]);

  // Recalcular envío SOLO si el método es SHIPPING
  useEffect(() => {
    const updateShipping = async () => {
      if (deliveryMethod === "SHIPPING" && ubigeo.dist) {
        setIsCalculating(true);
        const cost = await calculateShippingCost({ totalWeight, destUbigeo: ubigeo.dist });
        setShippingCost(cost);
        setIsCalculating(false);
      } else {
        setShippingCost(0); // Costo 0 si es PICKUP o no hay distrito
      }
    };
    updateShipping();
  }, [ubigeo.dist, deliveryMethod, totalWeight]);

  const handleGoToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (deliveryMethod === "SHIPPING" && !ubigeo.dist) {
      return alert("Por favor, selecciona el destino del envío.");
    }
    setCurrentStep(2);
    window.scrollTo(0, 0);
  };

  if (items.length === 0) return <div className="p-20 text-center font-bold">Carrito vacío</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <StepIndicator currentStep={currentStep} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {currentStep === 1 ? (
            <form id="checkout-form" onSubmit={handleGoToPayment} className="space-y-6">
              {/* DATOS PERSONALES */}
              <section className="bg-white p-6 rounded-2xl border shadow-sm">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <User className="text-[#11ABC4]" size={20} /> Datos del Cliente
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input name="firstName" required placeholder="Nombres" className="input" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} />
                  <input name="lastName" required placeholder="Apellidos" className="input" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} />
                  <input name="document" required placeholder="DNI o RUC" className="input" value={formData.document} onChange={(e) => setFormData({...formData, document: e.target.value})} />
                  <input name="phone" required placeholder="Teléfono" className="input" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                </div>
              </section>

              {/* MÉTODO DE ENTREGA */}
              <section className="bg-white p-6 rounded-2xl border shadow-sm">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800">
                  ¿Cómo deseas recibir tu pedido?
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod("SHIPPING")}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                      deliveryMethod === "SHIPPING" ? "border-[#11ABC4] bg-[#11ABC4]/5 shadow-sm" : "border-gray-100 hover:border-gray-200"
                    )}
                  >
                    <Truck className={deliveryMethod === "SHIPPING" ? "text-[#11ABC4]" : "text-gray-400"} />
                    <div>
                      <p className="font-bold text-sm">Envío a Domicilio</p>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Vía Olva Courier</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMethod("PICKUP")}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                      deliveryMethod === "PICKUP" ? "border-[#11ABC4] bg-[#11ABC4]/5 shadow-sm" : "border-gray-100 hover:border-gray-200"
                    )}
                  >
                    <Store className={deliveryMethod === "PICKUP" ? "text-[#11ABC4]" : "text-gray-400"} />
                    <div>
                      <p className="font-bold text-sm">Recojo en Tienda</p>
                      <p className="text-[10px] text-green-600 uppercase font-bold">¡Gratis!</p>
                    </div>
                  </button>
                </div>

                {deliveryMethod === "SHIPPING" ? (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Dirección de Envío</p>
                    <UbigeoSelects dept={ubigeo.dept} prov={ubigeo.prov} dist={ubigeo.dist} onChange={(t, v) => setUbigeo(prev => ({ ...prev, [t]: v, ...(t === "dept" ? { prov: "", dist: "" } : {}), ...(t === "prov" ? { dist: "" } : {}) }))} />
                    <input required placeholder="Calle / Avenida / Nro / Dpto" className="input" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                    <textarea placeholder="Referencia (Ej: Casa frente al parque)" className="input min-h-[80px]" value={formData.reference} onChange={(e) => setFormData({...formData, reference: e.target.value})} />
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-600 animate-in zoom-in-95 duration-200">
                    <p className="font-bold text-[#11ABC4] mb-1">Punto de recojo:</p>
                    <p>Av. Principal 123, Trujillo. (Horario: Lun-Sab 9am a 7pm)</p>
                  </div>
                )}
              </section>
            </form>
          ) : (
            <PaymentSection 
              formData={formData}
              ubigeo={deliveryMethod === "PICKUP" ? "130101" : ubigeo.dist}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              onBack={() => setCurrentStep(1)}
              total={total}
              shippingCost={shippingCost || 0}
              items={items}
            />
          )}
        </div>

        <OrderSummary 
          items={items} 
          total={total} 
          shippingCost={shippingCost}
          isCalculating={isCalculating}
          step={currentStep}
          paymentMethod={paymentMethod}
          formId="checkout-form"
          deliveryMethod={deliveryMethod}
        />
      </div>
    </div>
  );
}