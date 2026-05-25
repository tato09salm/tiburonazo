"use client";

import { User, MapPin, LogOut } from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react"; // O tu método de autenticación personalizado

interface Props {
    activeSubtab: string;
}

export function AccountSidebar({ activeSubtab }: Props) {
    return (
        <nav className="flex flex-row md:flex-col gap-1 bg-gray-50 p-2 rounded-2xl border border-gray-100 overflow-x-auto md:overflow-visible scrollbar-none">
            <Link
                href="?tab=cuenta&subtab=datos"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex-1 md:flex-initial ${activeSubtab === "datos"
                        ? "bg-[#CCECFB] text-[#11ABC4]"
                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                    }`}
            >
                <User size={16} />
                Datos Personales
            </Link>

            <Link
                href="?tab=cuenta&subtab=direcciones"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex-1 md:flex-initial ${activeSubtab === "direcciones"
                        ? "bg-[#CCECFB] text-[#11ABC4]"
                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                    }`}
            >
                <MapPin size={16} />
                Direcciones
            </Link>

            <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-red-500 hover:bg-red-50/60 transition-all text-left whitespace-nowrap flex-1 md:flex-initial"
            >
                <LogOut size={16} />
                Cerrar Sesión
            </button>
        </nav>
    );
}