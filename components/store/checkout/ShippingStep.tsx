"use client";

import { useState } from "react";
import { MapPin, Plus, Check, MapPinPlus, FileText, AlertCircle, Edit2, Trash2, X } from "lucide-react";
import { getDepartments, getProvinces, getDistricts } from "ubigeo-fns";
import { saveAddress, deleteAddress } from "@/actions/address.actions";
import { UbigeoSelects } from "../UbigeoSelects";
import { cn } from "@/lib/utils";

export function ShippingStep({ addresses, selectedAddressId, onSelectAddress, onRefreshAddresses, register, errors }: any) {
    // Estados para control de Modales
    const [modalMode, setModalMode] = useState<"CREATE" | "EDIT" | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [modalError, setModalError] = useState("");

    // Estados del formulario interno de direcciones
    const [selectedAddressForAction, setSelectedAddressForAction] = useState<any>(null);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [addressLine, setAddressLine] = useState("");
    const [reference, setReference] = useState("");
    const [dept, setDept] = useState("");
    const [prov, setProv] = useState("");
    const [dist, setDist] = useState("");

    // Abrir modal para crear
    const openCreateModal = () => {
        setModalError("");
        setSelectedAddressForAction(null);
        setFirstName(""); setLastName(""); setPhone(""); setAddressLine(""); setReference("");
        setDept(""); setProv(""); setDist("");
        setModalMode("CREATE");
    };

    // Abrir modal para editar pre-cargando los datos existentes
    const openEditModal = (e: React.MouseEvent, addr: any) => {
        e.stopPropagation(); // Evita que se seleccione la tarjeta al hacer clic en editar
        setModalError("");
        setSelectedAddressForAction(addr);
        setFirstName(addr.firstName);
        setLastName(addr.lastName);
        setPhone(addr.phone);
        setAddressLine(addr.address);
        setReference(addr.reference || "");

        // Desglosar ubigeo para los selectores mutables
        if (addr.ubigeo && addr.ubigeo.length === 6) {
            setDept(addr.ubigeo.substring(0, 2));
            setProv(addr.ubigeo.substring(0, 4));
            setDist(addr.ubigeo);
        }
        setModalMode("EDIT");
    };

    // Abrir confirmación de eliminación
    const openDeleteModal = (e: React.MouseEvent, addr: any) => {
        e.stopPropagation(); // Evita la selección accidental de la tarjeta
        setSelectedAddressForAction(addr);
        setIsDeleteOpen(true);
    };

    // Guardar nueva o actualizar existente
    const handleSaveAddress = async () => {
        if (!firstName || !lastName || !phone || !addressLine || !dist) {
            setModalError("Por favor, completa todos los campos obligatorios.");
            return;
        }
        if (!/^9\d{8}$/.test(phone)) {
            setModalError("El número de celular debe tener 9 dígitos y empezar con 9.");
            return;
        }

        setModalError("");
        setLoading(true);
        try {
            await saveAddress({
                id: modalMode === "EDIT" ? selectedAddressForAction.id : undefined,
                firstName, lastName, phone, address: addressLine, reference, ubigeo: dist
            });
            await onRefreshAddresses();
            setModalMode(null);
        } catch (err) {
            setModalError("Error al procesar la dirección.");
        } finally {
            setLoading(false);
        }
    };

    // Ejecutar eliminación física/lógica
    const handleDeleteExecute = async () => {
        if (!selectedAddressForAction) return;
        setLoading(true);
        try {
            await deleteAddress(selectedAddressForAction.id);
            await onRefreshAddresses();
            setIsDeleteOpen(false);
        } catch (err) {
            alert("No se pudo eliminar la dirección.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-200">

            {/* 1. SELECCIÓN DE DIRECCIONES EN REJILLA FLUIDA */}
            <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-sm font-black uppercase tracking-wider text-gray-400">Dirección</h3>
                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="flex items-center gap-1.5 text-xs font-bold text-[#11ABC4] hover:bg-[#11ABC4]/10 px-3 py-1.5 rounded-xl transition-all"
                    >
                        <Plus size={14} /> Nueva dirección
                    </button>
                </div>

                {addresses.length === 0 ? (
                    <div className="p-8 border border-dashed rounded-2xl flex flex-col items-center justify-center text-center bg-gray-50/50">
                        <MapPinPlus className="text-gray-300 mb-2" size={32} />
                        <p className="text-xs font-bold text-gray-600">No tienes direcciones guardadas</p>
                        <button type="button" onClick={openCreateModal} className="btn-primary text-[11px] px-4 py-2 rounded-xl mt-3">
                            Registrar Primera Dirección
                        </button>
                    </div>
                ) : (
                    /* Rejilla responsive: Máximo 3 por fila en pantallas medianas/grandes, añade hacia el costado */
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {addresses.map((addr: any) => {
                            const depObj = getDepartments().find(d => d.code === addr.ubigeo.substring(0, 2));
                            const provObj = getProvinces(addr.ubigeo.substring(0, 2)).find(p => p.code === addr.ubigeo.substring(0, 4));
                            const distObj = getDistricts(addr.ubigeo.substring(0, 4)).find(d => d.code === addr.ubigeo);
                            const isChecked = selectedAddressId === addr.id;

                            return (
                                <div
                                    key={addr.id}
                                    onClick={() => onSelectAddress(addr.id)}
                                    className={cn(
                                        "p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between h-44 relative group",
                                        isChecked ? "border-[#11ABC4] bg-[#11ABC4]/5 shadow-sm" : "border-gray-100 hover:border-gray-200 bg-white"
                                    )}
                                >
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-start gap-2">
                                            <p className="text-xs font-black text-gray-900 truncate max-w-[80%]">
                                                {addr.firstName} {addr.lastName}
                                            </p>
                                            <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center shrink-0", isChecked ? "bg-[#11ABC4] border-[#11ABC4] text-white" : "border-gray-300")}>
                                                {isChecked && <Check size={10} />}
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-gray-500 font-medium">{addr.phone}</p>
                                        <p className="text-[11px] text-gray-600 line-clamp-2 mt-1 leading-tight">{addr.address}</p>
                                        {addr.reference && <p className="text-[10px] text-gray-400 italic line-clamp-1">Ref: {addr.reference}</p>}
                                    </div>

                                    <div className="mt-auto pt-2 border-t border-gray-50 flex justify-between items-center">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight truncate max-w-[60%]">
                                            {distObj?.name}, {depObj?.name}
                                        </p>
                                        {/* Botones de acción contextuales flotantes o visibles al pasar el cursor */}
                                        <div className="flex gap-1.5 opacity-90 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                            <button
                                                type="button"
                                                onClick={(e) => openEditModal(e, addr)}
                                                className="p-1.5 bg-gray-50 hover:bg-amber-50 rounded-lg text-gray-400 hover:text-amber-600 transition-colors"
                                                title="Editar Dirección"
                                            >
                                                <Edit2 size={12} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => openDeleteModal(e, addr)}
                                                className="p-1.5 bg-gray-50 hover:bg-rose-50 rounded-lg text-gray-400 hover:text-rose-600 transition-colors"
                                                title="Eliminar Dirección"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                {errors.addressId && (
                    <p className="text-xs text-rose-500 flex items-center gap-1 font-semibold mt-1"><AlertCircle size={12} /> {errors.addressId.message}</p>
                )}
            </section>

            {/* 2. IDENTIFICACIÓN LEGAL (DNI/RUC SOLAMENTE) */}
            <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-gray-400 flex items-center gap-2">
                    Comprobante de Pago
                </h3>
                <div className="max-w-md">
                    <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wide">DNI o RUC *</label>
                    <input
                        {...register("document")}
                        className="input text-xs"
                        placeholder="Introduce los 8 dígitos del DNI o 11 del RUC"
                        maxLength={11}
                    />
                    {errors.document && <p className="text-[11px] text-rose-500 font-semibold mt-1">{errors.document.message}</p>}
                </div>
            </section>

            {/* MODAL MULTI-PROPÓSITO (CREAR / EDITAR) */}
            {modalMode && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="px-6 py-4 border-b font-bold text-gray-800 text-sm uppercase tracking-wider flex justify-between items-center">
                            <span>{modalMode === "EDIT" ? "Modificar Dirección" : "Nueva Dirección de Envío"}</span>
                            <button type="button" onClick={() => setModalMode(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                        </div>

                        <div className="p-6 space-y-4 overflow-y-auto text-xs">
                            {modalError && (
                                <p className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 font-semibold flex items-center gap-2">
                                    <AlertCircle size={16} /> {modalError}
                                </p>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Nombres *</label>
                                    <input placeholder="Nombres" className="input mt-0.5" value={firstName} onChange={e => setFirstName(e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Apellidos *</label>
                                    <input placeholder="Apellidos" className="input mt-0.5" value={lastName} onChange={e => setLastName(e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Celular de contacto *</label>
                                <input placeholder="Ej: 987654321" className="input mt-0.5" value={phone} onChange={e => setPhone(e.target.value)} maxLength={9} />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Dirección completa *</label>
                                <input placeholder="Calle, Avenida, Número, Depto" className="input mt-0.5" value={addressLine} onChange={e => setAddressLine(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Referencia de ubicación</label>
                                <input placeholder="Ej: Frente al parque zonal, portón verde" className="input mt-0.5" value={reference} onChange={e => setReference(e.target.value)} />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Ubigeo de Destino *</label>
                                <UbigeoSelects
                                    dept={dept} prov={prov} dist={dist}
                                    onChange={(type, val) => {
                                        if (type === "dept") { setDept(val); setProv(""); setDist(""); }
                                        else if (type === "prov") { setProv(val); setDist(""); }
                                        else setDist(val);
                                    }}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                                <button type="button" onClick={() => setModalMode(null)} className="px-4 py-2 font-bold text-gray-400 hover:text-gray-600">Cancelar</button>
                                <button
                                    type="button"
                                    onClick={handleSaveAddress}
                                    disabled={loading}
                                    className="btn-primary px-6 py-2 rounded-xl font-bold"
                                >
                                    {loading ? "Procesando..." : modalMode === "EDIT" ? "Guardar Cambios" : "Guardar Dirección"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL PEQUEÑO DE CONFIRMACIÓN PARA ELIMINACIÓN */}
            {isDeleteOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-100">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center space-y-4">
                        <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-600 mx-auto">
                            <Trash2 size={22} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-900">¿Eliminar esta dirección?</h4>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                Esta acción no se puede deshacer. Se removerá de tu historial de envíos.
                            </p>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsDeleteOpen(false)}
                                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold text-gray-600 transition-colors"
                            >
                                No, mantener
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteExecute}
                                disabled={loading}
                                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 rounded-xl text-xs font-bold text-white transition-colors shadow-sm"
                            >
                                {loading ? "Eliminando..." : "Sí, eliminar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}