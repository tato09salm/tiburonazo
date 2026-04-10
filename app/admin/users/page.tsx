import { getUsers } from "@/actions/admin.actions";
import { ToggleUserStatus } from "@/components/admin/ToggleUserStatus";
import { UserForm } from "@/components/admin/UserForm";
import { Pagination } from "@/components/admin/Pagination";
import { UserFilters } from "@/components/admin/UserFilters";
import { Users } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Usuarios - Admin" };

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  VENDEDOR: "bg-blue-100 text-blue-700",
  CLIENTE: "bg-gray-100 text-gray-600",
};

interface Props {
  searchParams: Promise<{
    page?: string;
    search?: string;
    role?: string;
    status?: string;
  }>;
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const params = await searchParams;
  const currentPage = Number(params.page) || 1;
  const search = params.search;
  const role = params.role;
  const status = params.status;

  const { users, totalPages, totalFiltered, globalCount } = await getUsers(
    currentPage,
    5, 
    search,
    role,
    status
  );

  return (
    <div className="space-y-6 relative z-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users size={28} className="text-[#11ABC4]" /> Usuarios
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {globalCount} usuarios registrados
          </p>
        </div>
      </div>

      <UserFilters />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* COLUMNA IZQUIERDA: Ajustamos el z-index aquí */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-6 z-10 shadow-sm border border-gray-100 bg-white rounded-xl">
            <h2 className="font-heading text-lg font-bold mb-4 text-gray-800">Crear nuevo usuario</h2>
            <UserForm />
          </div>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="card overflow-hidden h-fit shadow-sm border border-gray-100 bg-white rounded-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Usuario</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Rol</th>
                    <th className="px-6 py-4 text-center">Estado</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.length > 0 ? (
                    users.map((u) => (
                      <tr
                        key={u.id}
                        className={`hover:bg-gray-50/50 transition-colors ${
                          !u.isActive ? "bg-gray-50/60 opacity-80" : ""
                        }`}
                      >
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-800">{u.name}</p>
                          <p className="text-[10px] text-gray-400">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{u.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${ROLE_COLORS[u.role]}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            u.isActive 
                              ? "bg-green-100 text-green-800" 
                              : "bg-red-100 text-red-800"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${u.isActive ? "bg-green-500" : "bg-red-500"}`} />
                            {u.isActive ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <ToggleUserStatus id={u.id} isActive={u.isActive} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <Users size={48} className="mb-2 opacity-20" />
                          <p className="text-base font-medium">Sin resultados</p>
                          <p className="text-sm">No hay usuarios que coincidan con los filtros</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-gray-50">
              <Pagination totalPages={totalPages} />
            </div>
          </div>
          
          <div className="flex flex-col items-center sm:flex-row sm:justify-center px-2 gap-2">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Mostrando {users.length} de {totalFiltered} resultados encontrados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}