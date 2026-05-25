"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
import { updateProfile } from "@/actions/account.actions";
import { Loader2, Edit2, X, CheckCircle2 } from "lucide-react";

interface Props {
    userData: { firstName: string; lastName: string; email: string };
}

export function PersonalDataView({ userData }: Props) {
    const { data: session, update } = useSession();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // Usamos los datos dinámicos de la sesión si están disponibles, de lo contrario los del SSR
    const currentFields = {
        firstName: session?.user?.firstName || userData.firstName,
        lastName: session?.user?.lastName || userData.lastName,
        email: session?.user?.email || userData.email,
    };

    const { register, handleSubmit, formState: { errors }, reset } = useForm({
        values: currentFields, // Se sincroniza dinámicamente si la sesión cambia
    });

    const onSubmit = async (data: typeof userData) => {
        setLoading(true);
        setError("");
        try {
            await updateProfile(data);

            // Sincroniza el cliente de NextAuth con la base de datos de manera inmediata
            await update({
                user: {
                    ...session?.user,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email
                }
            });

            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setIsModalOpen(false);
            }, 1500);
        } catch (err: any) {
            setError(err.message || "Ocurrió un error inesperado.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 font-heading">Datos Personales</h3>
                    <p className="text-gray-400 text-xs">Información básica y de contacto de tu perfil.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 text-xs font-bold text-[#11ABC4] bg-[#CCECFB]/50 hover:bg-[#CCECFB] px-4 py-2 rounded-xl transition-all"
                >
                    <Edit2 size={13} /> Editar datos
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50/60 rounded-2xl border border-gray-100">
                    <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Nombre Completo</span>
                    <p className="font-semibold text-gray-800 mt-0.5">
                        {[currentFields.firstName, currentFields.lastName].filter(Boolean).join(" ") || "No registrado"}
                    </p>
                </div>

                <div className="p-4 bg-gray-50/60 rounded-2xl border border-gray-100">
                    <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Correo Electrónico</span>
                    <p className="font-semibold text-gray-800 mt-0.5">{currentFields.email}</p>
                </div>
            </div>

            {/* MODAL DE EDICIÓN */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-800">Editar Datos Personales</h4>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg">
                                <X size={18} />
                            </button>
                        </div>

                        {success ? (
                            <div className="p-8 text-center flex flex-col items-center justify-center space-y-2">
                                <CheckCircle2 size={42} className="text-emerald-500 animate-bounce" />
                                <p className="font-bold text-gray-800">¡Datos actualizados!</p>
                                <p className="text-xs text-gray-400">La interfaz se ha sincronizado correctamente.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 mb-1">Nombres *</label>
                                    <input {...register("firstName", { required: "Este campo es requerido" })} className="input text-xs" />
                                    {errors.firstName && <p className="text-[10px] text-red-500 mt-1">{errors.firstName.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 mb-1">Apellidos *</label>
                                    <input {...register("lastName", { required: "Este campo es requerido" })} className="input text-xs" />
                                    {errors.lastName && <p className="text-[10px] text-red-500 mt-1">{errors.lastName.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 mb-1">Correo Electrónico *</label>
                                    <input {...register("email", { required: "Este campo es requerido" })} type="email" className="input text-xs" />
                                    {errors.email && <p className="text-[10px] text-red-500 mt-1">{errors.email.message}</p>}
                                </div>

                                {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

                                <div className="flex gap-2 justify-end pt-2">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 rounded-xl">
                                        Cancelar
                                    </button>
                                    <button type="submit" disabled={loading} className="btn-primary px-5 py-2 text-xs font-semibold rounded-xl shadow-sm flex items-center gap-2">
                                        {loading && <Loader2 size={14} className="animate-spin" />} Guardar
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}