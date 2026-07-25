"use client";

import { ShoppingBag, UserCircle } from "lucide-react";
import Link from "next/link";
import { AccountSidebar } from "./AccountSidebar";
import { OrdersView } from "./OrdersView";
import { PersonalDataView } from "./PersonalDataView";
import { AddressesView } from "./AddressesView";

// Definición de la estructura de dirección según tu esquema Prisma
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
    activeTab: string;
    activeSubtab: string;
    userData: { firstName: string; lastName: string; email: string };
    orders: any[];
    initialAddresses: DBAddress[]; // Nueva propiedad conectada a la base de datos
}

export function AccountTabs({ activeTab, activeSubtab, userData, orders, initialAddresses }: Props) {
    return (
        <div className="space-y-8">
            {/* Navbar Superior Centrado */}
            <div className="flex justify-center">
                <div className="inline-flex p-1.5 bg-gray-100 rounded-2xl border border-gray-200/60 shadow-inner">
                    <Link
                        href="?tab=cuenta&subtab=datos"
                        className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === "cuenta"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-800"
                            }`}
                    >
                        <UserCircle size={18} />
                        Mi Cuenta
                    </Link>
                    <Link
                        href="?tab=pedidos"
                        className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === "pedidos"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-800"
                            }`}
                    >
                        <ShoppingBag size={18} />
                        Mis Pedidos
                        {orders.length > 0 && (
                            <span className="ml-1 px-2 py-0.5 text-[11px] font-bold bg-[#CCECFB] text-[#11ABC4] rounded-md">
                                {orders.length}
                            </span>
                        )}
                    </Link>
                </div>
            </div>

            {/* Vista de Contenido según la pestaña activa */}
            {activeTab === "pedidos" ? (
                <div className="animate-in fade-in duration-200">
                    <OrdersView orders={orders} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start animate-in fade-in duration-200">
                    {/* Sidebar de Cuenta */}
                    <div className="md:col-span-1">
                        <AccountSidebar activeSubtab={activeSubtab} />
                    </div>

                    {/* Subvistas de la Cuenta */}
                    <div className="md:col-span-3 bg-white border border-gray-100 shadow-sm rounded-3xl p-6 min-h-[400px]">
                        {activeSubtab === "datos" && <PersonalDataView userData={userData} />}

                        {/* Pasamos las direcciones del SSR al componente de cliente */}
                        {activeSubtab === "direcciones" && (
                            <AddressesView initialAddresses={initialAddresses} />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}