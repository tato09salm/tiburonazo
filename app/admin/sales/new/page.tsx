import { getStores, getVendedores } from "@/actions/admin.actions";
import { SaleForm } from "@/components/admin/sales/SaleForm";
import { ArrowLeft, BarChart3 } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";

export const metadata: Metadata = { title: "Registrar Venta - Admin" };

export default async function NewSalePage() {
  const [stores, vendedores, session] = await Promise.all([
    getStores(), 
    getVendedores(),
    auth()
  ]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/sales" className="text-gray-500 hover:text-[#11ABC4] flex items-center gap-2 text-sm font-medium transition-colors mb-2">
          <ArrowLeft size={16} /> Volver al historial
        </Link>
        <h1 className="font-heading text-3xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 size={28} className="text-[#11ABC4]" /> Registrar Venta
        </h1>
        <p className="text-gray-500 text-sm mt-1">Completa los datos para registrar una nueva venta.</p>
      </div>

      <SaleForm 
        stores={stores} 
        vendedores={vendedores} 
        currentUserId={session?.user?.id} 
      />
    </div>
  );
}
