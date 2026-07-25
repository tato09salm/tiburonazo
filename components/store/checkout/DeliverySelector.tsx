"use client";

import { Truck, Store } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    selected: "SHIPPING" | "PICKUP";
    onChange: (val: "SHIPPING" | "PICKUP") => void;
}

export function DeliverySelector({ selected, onChange }: Props) {
    return (
        <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h2 className="text-base font-bold mb-4 text-gray-900 font-heading">¿Cómo deseas recibir tu pedido?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                    type="button"
                    onClick={() => onChange("SHIPPING")}
                    className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left",
                        selected === "SHIPPING" ? "border-[#11ABC4] bg-[#11ABC4]/5 shadow-sm" : "border-gray-100 hover:border-gray-200"
                    )}
                >
                    <Truck className={selected === "SHIPPING" ? "text-[#11ABC4]" : "text-gray-400"} size={22} />
                    <div>
                        <p className="font-bold text-sm text-gray-900">Envío a Domicilio</p>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => onChange("PICKUP")}
                    className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left",
                        selected === "PICKUP" ? "border-[#11ABC4] bg-[#11ABC4]/5 shadow-sm" : "border-gray-100 hover:border-gray-200"
                    )}
                >
                    <Store className={selected === "PICKUP" ? "text-[#11ABC4]" : "text-gray-400"} size={22} />
                    <div>
                        <p className="font-bold text-sm text-gray-900">Recojo en Tienda</p>
                        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wide">Gratis local Trujillo</p>
                    </div>
                </button>
            </div>
        </section>
    );
}