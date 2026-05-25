"use client";

import { useState, useTransition } from "react";
import { Plus, Edit2, Check, Star, X, MapPin, Loader2 } from "lucide-react";
import { getDepartments, getProvinces, getDistricts } from "ubigeo-fns";
import { UbigeoSelects } from "../UbigeoSelects";
import { saveAddress, setDefaultAddress } from "@/actions/address.actions";
import { useRouter } from "next/navigation";

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

interface Props {
    initialAddresses: DBAddress[];
}

export function AddressesView({ initialAddresses }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<DBAddress | null>(null);

    // Formulario Interno Desestructurado e Independiente
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [addressLine, setAddressLine] = useState("");
    const [reference, setReference] = useState("");

    // Estados de control para UbigeoSelects
    const [dept, setDept] = useState("");
    const [prov, setProv] = useState("");
    const [dist, setDist] = useState("");

    const handleUbigeoChange = (type: "dept" | "prov" | "dist", value: string) => {
        if (type === "dept") {
            setDept(value); setProv(""); setDist("");
        } else if (type === "prov") {
            setProv(value); setDist("");
        } else {
            setDist(value);
        }
    };

    const handleSetDefault = (id: string) => {
        startTransition(async () => {
            try {
                await setDefaultAddress(id);
                router.refresh();
            } catch (err) {
                alert("No se pudo cambiar la dirección principal");
            }
        });
    };

    const openModal = (addr: DBAddress | null) => {
        if (addr) {
            setEditingAddress(addr);
            setFirstName(addr.firstName);
            setLastName(addr.lastName);
            setPhone(addr.phone);
            setAddressLine(addr.address);
            setReference(addr.reference || "");
            setDept(addr.ubigeo.substring(0, 2));
            setProv(addr.ubigeo.substring(0, 4));
            setDist(addr.ubigeo);
        } else {
            setEditingAddress(null);
            // COMPLETA LIMPIEZA: No hereda ningún dato ni del usuario ni de estados pasados
            setFirstName("");
            setLastName("");
            setPhone("");
            setAddressLine("");
            setReference("");
            setDept(""); setProv(""); setDist("");
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!dist) return alert("Por favor selecciona Departamento, Provincia y Distrito.");

        startTransition(async () => {
            try {
                await saveAddress({
                    id: editingAddress?.id,
                    firstName,
                    lastName,
                    phone,
                    address: addressLine,
                    reference,
                    ubigeo: dist
                });
                setIsModalOpen(false);
                router.refresh();
            } catch (error: any) {
                alert(error.message || "Error al procesar la dirección.");
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 font-heading">Mis Direcciones</h3>
                    <p className="text-gray-400 text-xs">Administra tus ubicaciones registradas en tiempo real.</p>
                </div>
                <button
                    onClick={() => openModal(null)}
                    className="flex items-center gap-2 btn-primary py-2 px-4 text-xs font-semibold rounded-xl shadow-sm"
                >
                    <Plus size={14} /> Añadir nueva dirección
                </button>
            </div>

            {/* RENDERIZADO DESDE LA BD */}
            {initialAddresses.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-10 border border-dashed border-gray-200 rounded-3xl bg-gray-50/40">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
                        <MapPin size={22} />
                    </div>
                    <p className="text-sm font-bold text-gray-700">No tienes direcciones registradas</p>
                    <p className="text-xs text-gray-400 max-w-xs mt-1">
                        Agrega una ubicación para agilizar el proceso de envío en tus futuras compras.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {initialAddresses.map((addr) => {
                        const deparCode = addr.ubigeo.substring(0, 2);
                        const provCode = addr.ubigeo.substring(0, 4);

                        const depObj = getDepartments().find(d => d.code === deparCode);
                        const provObj = getProvinces(deparCode).find(p => p.code === provCode);
                        const distObj = getDistricts(provCode).find(d => d.code === addr.ubigeo);

                        return (
                            <div key={addr.id} className={`p-4 rounded-2xl border transition-all ${addr.isDefault ? "bg-[#CCECFB]/10 border-[#11ABC4]" : "bg-white border-gray-100 hover:border-gray-200"}`}>
                                <div className="flex justify-between items-start gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-sm text-gray-900">{addr.firstName} {addr.lastName}</p>
                                            {addr.isDefault && (
                                                <span className="inline-flex items-center gap-1 bg-[#11ABC4] text-white px-2 py-0.5 text-[10px] font-black rounded-md tracking-wider">
                                                    <Check size={10} /> Principal
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-700">{addr.address}</p>
                                        {addr.reference && <p className="text-xs text-gray-400 font-medium">Ref: {addr.reference}</p>}
                                        <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wide">
                                            {distObj?.name || ""}, {provObj?.name || ""} - {depObj?.name || ""} · Tlf: {addr.phone}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        {!addr.isDefault && (
                                            <button
                                                disabled={isPending}
                                                onClick={() => handleSetDefault(addr.id)}
                                                className="p-1.5 text-gray-400 hover:text-amber-500 transition-colors disabled:opacity-50"
                                            >
                                                <Star size={16} />
                                            </button>
                                        )}
                                        <button
                                            disabled={isPending}
                                            onClick={() => openModal(addr)}
                                            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all disabled:opacity-50"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MODAL PARA AGREGAR / EDITAR */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-800">
                                {editingAddress ? "Modificar Dirección de Envío" : "Registrar Nueva Dirección"}
                            </h4>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 mb-1">Nombres del Destinatario *</label>
                                    <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="input text-xs" placeholder="Ej: Juan" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 mb-1">Apellidos del Destinatario *</label>
                                    <input required value={lastName} onChange={(e) => setLastName(e.target.value)} className="input text-xs" placeholder="Ej: Pérez" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 mb-1">Teléfono de Contacto *</label>
                                <input required value={phone} onChange={(e) => setPhone(e.target.value)} className="input text-xs" placeholder="Ej: 987654321" />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 mb-1">Dirección Completa *</label>
                                <input required value={addressLine} onChange={(e) => setAddressLine(e.target.value)} className="input text-xs" placeholder="Ej: Av. Benavides 456" />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 mb-1">Referencia Adicional</label>
                                <input value={reference} onChange={(e) => setReference(e.target.value)} className="input text-xs" placeholder="Ej: Portón verde, frente al parque" />
                            </div>

                            <div className="bg-gray-50/50 border border-gray-100 p-4 rounded-2xl">
                                <UbigeoSelects dept={dept} prov={prov} dist={dist} onChange={handleUbigeoChange} />
                            </div>

                            <div className="flex gap-2 justify-end pt-4 border-t border-gray-100">
                                <button type="button" disabled={isPending} onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 rounded-xl">
                                    Cerrar
                                </button>
                                <button type="submit" disabled={isPending} className="btn-primary px-6 py-2 text-xs font-semibold rounded-xl shadow-sm flex items-center gap-2">
                                    {isPending && <Loader2 size={14} className="animate-spin" />}
                                    {editingAddress ? "Actualizar Ubicación" : "Guardar Ubicación"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}