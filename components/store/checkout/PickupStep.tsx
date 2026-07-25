"use client";

import { Store, User } from "lucide-react";

export function PickupStep({ register, errors }: any) {
    return (
        <div className="space-y-6 animate-in fade-in duration-200">

            {/* Formulario Editable */}
            <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-gray-400 flex items-center gap-2">
                    Comprobante de Pago
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="label-text">Nombres *</label>
                        <input {...register("firstName")} className="input text-xs" placeholder="Nombres del recolector" />
                        {errors.firstName && <p className="text-[11px] text-rose-500 mt-0.5">{errors.firstName.message}</p>}
                    </div>

                    <div>
                        <label className="label-text">Apellidos *</label>
                        <input {...register("lastName")} className="input text-xs" placeholder="Apellidos del recolector" />
                        {errors.lastName && <p className="text-[11px] text-rose-500 mt-0.5">{errors.lastName.message}</p>}
                    </div>

                    <div>
                        <label className="label-text">DNI o RUC *</label>
                        <input {...register("document")} className="input text-xs" placeholder="Introduce los 8 dígitos del DNI o 11 del RUC" maxLength={11} />
                        {errors.document && <p className="text-[11px] text-rose-500 mt-0.5">{errors.document.message}</p>}
                    </div>

                    <div>
                        <label className="label-text">Teléfono *</label>
                        <input {...register("phone")} className="input text-xs" maxLength={9} />
                        {errors.phone && <p className="text-[11px] text-rose-500 mt-0.5">{errors.phone.message}</p>}
                    </div>
                </div>
            </section>

            {/* Alerta del Punto Físico */}
            <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-3xl flex gap-4 items-start">
                <Store className="text-emerald-600 shrink-0 mt-0.5" size={20} />
                <div>
                    <p className="text-xs font-black text-emerald-900 uppercase tracking-wide">Punto de Entrega</p>
                    <p className="text-xs text-emerald-700/90 mt-0.5">Av. Principal 123, Trujillo. (Frente al Centro Cívico)</p>
                    <p className="text-[10px] text-emerald-600/80 font-medium mt-1">Horarios: Lunes a Sábado de 9:00 AM a 7:00 PM</p>
                </div>
            </div>
        </div>
    );
}