import { getInventoryMoves, getInventoryStats } from "@/actions/admin.actions";
import { History, Plus, Warehouse } from "lucide-react";
import { InventoryModal } from "@/components/admin/inventory/InventoryModal";
import { InventoryStatsCards } from "@/components/admin/inventory/InventoryStatsCards";
import { InventoryKardexTable } from "@/components/admin/inventory/InventoryKardexTable";

export default async function InventoryPage() {
  const [moves, stats] = await Promise.all([
    getInventoryMoves(),
    getInventoryStats(),
  ]);

  return (
    <div className="space-y-4 pb-10 max-w-[1600px] mx-auto animate-in fade-in duration-500">

      {/* HEADER*/}
      <div className="font-heading text-3xl font-bold text-gray-900 flex items-center gap-2">
        <Warehouse size={28} className="text-[#11ABC4]" /> Inventario
      </div>

      {/* KPIs*/}
      <section>
        <InventoryStatsCards stats={stats} />
      </section>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">

        {/* TOOLBAR SUPERIOR DE LA TABLA */}
        <div className="px-6 py-5 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-50 text-[#11ABC4] rounded-xl">
              <History size={18} />
            </div>
            <h3 className="font-bold text-gray-800 text-base">Movimientos</h3>
          </div>

          {/* EL BOTÓN */}
          <InventoryModal>
            <button className="
              flex items-center gap-2 px-5 py-2.5 
              bg-[#1a1a2e] text-white rounded-xl text-xs font-black 
              shadow-lg shadow-blue-900/10 
              group
              /* TRANSICIÓN MEJORADA */
              transition-all duration-300 ease-in-out
              hover:bg-[#11ABC4] hover:shadow-[#11ABC4]/20 hover:-translate-y-0.5
              active:scale-95 active:translate-y-0
            ">
              <Plus
                size={16}
                className="transition-transform duration-500 ease-out group-hover:rotate-90"
              />
              <span>REGISTRAR MOVIMIENTO</span>
            </button>
          </InventoryModal>
        </div>

        {/* TABLA */}
        <div className="p-1">
          <InventoryKardexTable initialMoves={moves} />
        </div>
      </div>

    </div>
  );
}