"use client";

import { useState, useEffect, useMemo, useRef, useTransition } from "react";
import { useCart } from "@/hooks/useCart";
import { useSession } from "next-auth/react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkoutSchema, type CheckoutFormData } from "@/lib/validations/checkout.schema";
import { getMyAddresses } from "@/actions/address.actions";
import { calculateShippingCost } from "@/lib/shipping-service";

import { StepIndicator } from "@/components/store/checkout/StepIndicator";
import { OrderSummary } from "@/components/store/checkout/OrderSummary";
import { PaymentSection } from "@/components/store/checkout/PaymentSection";
import { DeliverySelector } from "@/components/store/checkout/DeliverySelector";
import { ShippingStep } from "@/components/store/checkout/ShippingStep";
import { PickupStep } from "@/components/store/checkout/PickupStep";

// Definición estricta de la estructura de las direcciones provenientes de la BD
interface DBAddress {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    reference: string | null;
    ubigeo: string;
    isDefault: boolean;
    userId: string;
    createdAt: Date;
}

// Interfaz para el payload final procesado por la orden
interface FinalOrderPayload {
    deliveryMethod: "SHIPPING" | "PICKUP";
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    reference: string;
    ubigeo: string;
    document: string;
}

export default function CheckoutPage() {
    const { items, total } = useCart();
    const { data: session } = useSession();
    const [, startTransition] = useTransition();

    const [currentStep, setCurrentStep] = useState<number>(1);
    const [paymentMethod, setPaymentMethod] = useState<string>("CULQI");
    const [addresses, setAddresses] = useState<DBAddress[]>([]);
    const [shippingCost, setShippingCost] = useState<number>(0);
    const [isCalculating, setIsCalculating] = useState<boolean>(false);

    // Payload unificado y fuertemente tipado
    const [finalPayload, setFinalPayload] = useState<FinalOrderPayload | null>(null);

    const totalWeight = useMemo(() => items.reduce((acc, item) => acc + (0.2 * item.quantity), 0), [items]);

    const hasInitialized = useRef(false);

    // Al aplanar el esquema, todos los defaultValues son válidos simultáneamente
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CheckoutFormData>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            deliveryMethod: "SHIPPING",
            addressId: "",
            document: "",
            firstName: "",
            lastName: "",
            phone: "",
        }
    });

    const selectedMethod = watch("deliveryMethod");
    const selectedAddressId = watch("addressId");

    // 1. Carga de direcciones y autocompletado desde NextAuth Session con tipado seguro
    useEffect(() => {
        startTransition(async () => {
            const res = await getMyAddresses();
            setAddresses(res as DBAddress[]);

            if (!hasInitialized.current) {
                const defaultAddr = res.find(a => a.isDefault);
                if (defaultAddr) {
                    setValue("addressId", defaultAddr.id);
                }
                hasInitialized.current = true;
            }
        });

        if (session?.user) {
            // Evitamos usar 'any' mapeando de forma segura contra propiedades existentes de la sesión
            const user = session.user as { firstName?: string; lastName?: string; phone?: string };
            setValue("firstName", user.firstName || "");
            setValue("lastName", user.lastName || "");
            if (user.phone) {
                setValue("phone", user.phone);
            }
        }
    }, [session, setValue]);

    // 2. Cálculo reactivo del coste de envío (Olva Courier) basado en el ubigeo de la tarjeta
    useEffect(() => {
        const updateShipping = async () => {
            if (selectedMethod === "SHIPPING" && selectedAddressId) {
                const target = addresses.find(a => a.id === selectedAddressId);
                if (target) {
                    setIsCalculating(true);
                    const cost = await calculateShippingCost({ totalWeight, destUbigeo: target.ubigeo });
                    setShippingCost(cost);
                    setIsCalculating(false);
                }
            } else {
                setShippingCost(0);
            }
        };
        updateShipping();
    }, [selectedAddressId, selectedMethod, addresses, totalWeight]);

    // 3. Manejador de envío tipado bajo la interfaz SubmitHandler de react-hook-form
    const onSubmitForm: SubmitHandler<CheckoutFormData> = (data) => {
        let payload: FinalOrderPayload;

        if (data.deliveryMethod === "SHIPPING") {
            const addr = addresses.find(a => a.id === data.addressId);

            payload = {
                deliveryMethod: "SHIPPING",
                firstName: addr?.firstName || "",
                lastName: addr?.lastName || "",
                phone: addr?.phone || "",
                address: addr?.address || "",
                reference: addr?.reference || "",
                ubigeo: addr?.ubigeo || "",
                document: data.document,
            };
        } else {
            payload = {
                deliveryMethod: "PICKUP",
                firstName: data.firstName || "",
                lastName: data.lastName || "",
                phone: data.phone || "",
                document: data.document,
                address: "Av. Principal 123, Trujillo",
                reference: "Recojo en local principal",
                ubigeo: "130101",
            };
        }

        setFinalPayload(payload);
        setCurrentStep(2);
        window.scrollTo(0, 0);
    };

    if (items.length === 0) {
        return (
            <div className="p-20 text-center font-bold text-gray-400 flex flex-col items-center justify-center min-h-[50vh]">
                Tu carrito de compras se encuentra vacío.
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <StepIndicator currentStep={currentStep} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
                <div className="lg:col-span-2">
                    {currentStep === 1 ? (
                        <form id="checkout-form" onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">

                            <DeliverySelector
                                selected={selectedMethod}
                                onChange={(val: "SHIPPING" | "PICKUP") => setValue("deliveryMethod", val)}
                            />

                            {selectedMethod === "SHIPPING" ? (
                                <ShippingStep
                                    addresses={addresses}
                                    selectedAddressId={selectedAddressId}
                                    onSelectAddress={(id: string) => setValue("addressId", id)}
                                    onRefreshAddresses={async () => {
                                        const res = await getMyAddresses();
                                        setAddresses(res as DBAddress[]);
                                    }}
                                    register={register}
                                    errors={errors}
                                />
                            ) : (
                                <PickupStep
                                    register={register}
                                    errors={errors}
                                />
                            )}
                        </form>
                    ) : (
                        <PaymentSection
                            formData={finalPayload}
                            ubigeo={finalPayload?.ubigeo}
                            paymentMethod={paymentMethod}
                            setPaymentMethod={setPaymentMethod}
                            onBack={() => setCurrentStep(1)}
                            total={total}
                            shippingCost={shippingCost}
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
                    deliveryMethod={selectedMethod}
                />
            </div>
        </div>
    );
}