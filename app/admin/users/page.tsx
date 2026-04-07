import { getUsers } from "@/actions/admin.actions";
import { ToggleUserStatus } from "@/components/admin/ToggleUserStatus";
import { UserForm } from "@/components/admin/UserForm";
import { Users } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Usuarios - Admin" };

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  VENDEDOR: "bg-blue-100 text-blue-700",
  CLIENTE: "bg-gray-100 text-gray-600",
};

export default async function AdminUsersPage() {
  const users = await getUsers();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Users size={28} className="text-[#11ABC4]" /> Usuarios
        </h1>
        <p className="text-gray-500 text-sm mt-1">{users.length} usuarios registrados</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6">
          <h2 className="font-heading text-lg font-bold mb-4">Crear usuario</h2>
          <UserForm />
        </div>

        <div className="lg:col-span-2 card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Rol</th>
                <th className="px-4 py-3 text-center">Estado</th> {/* Nueva columna */}
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.id} className={`hover:bg-gray-50 ${!u.isActive ? "opacity-60" : ""}`}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-800">{u.name}</p>
                    <p className="text-[10px] text-gray-400">Registrado: {new Date(u.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${ROLE_COLORS[u.role]}`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                      {u.isActive ? "ACTIVO" : "INACTIVO"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ToggleUserStatus id={u.id} isActive={u.isActive} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
