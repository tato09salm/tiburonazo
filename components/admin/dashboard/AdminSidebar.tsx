"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, Package, Tag, BarChart3, ShoppingBag, Users,
  Warehouse, LogOut, Store, ChevronRight, Bookmark, Palette, Ruler,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "VENDEDOR"] },
  { label: "Productos", href: "/admin/products", icon: Package, roles: ["ADMIN"] },
  { label: "Categorías", href: "/admin/categories", icon: Tag, roles: ["ADMIN"] },
  { label: "Marcas", href: "/admin/brands", icon: Bookmark, roles: ["ADMIN"] },
  { label: "Colores", href: "/admin/colors", icon: Palette, roles: ["ADMIN"] },
  { label: "Tallas", href: "/admin/sizes", icon: Ruler, roles: ["ADMIN"] },
  { label: "Inventario", href: "/admin/inventory", icon: Warehouse, roles: ["ADMIN", "VENDEDOR"] },
  { label: "Ventas", href: "/admin/sales", icon: BarChart3, roles: ["ADMIN", "VENDEDOR"] },
  { label: "Pedidos", href: "/admin/orders", icon: ShoppingBag, roles: ["ADMIN"] },
  { label: "Usuarios", href: "/admin/users", icon: Users, roles: ["ADMIN"] },
];

interface Props { role: string; userName: string; }

export function AdminSidebar({ role, userName }: Props) {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-[#1a1a2e] text-gray-300 flex flex-col min-h-screen sticky top-0">
      <div className="p-5 border-b border-white/10">
        <Link href="/" className="font-brand text-2xl text-[#11ABC4] block">TIBURONAZO</Link>
        <span className="text-xs text-gray-500 mt-1 block">Panel Administrativo</span>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.filter((n) => n.roles.includes(role)).map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                active
                  ? "bg-[#11ABC4] text-white"
                  : "hover:bg-white/10 text-gray-400 hover:text-white"
              )}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {active && <ChevronRight size={14} className="ml-auto" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10">
        <div className="px-3 py-2 mb-1">
          <p className="text-xs font-semibold text-white truncate">{userName}</p>
          <p className="text-xs text-gray-500">{role}</p>
        </div>
        <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-400 hover:bg-white/10 hover:text-white transition-colors">
          <Store size={14} /> Ver tienda
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
        >
          <LogOut size={14} /> Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
