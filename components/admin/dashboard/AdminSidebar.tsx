"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, Package, Tag, BarChart3, ShoppingBag, Users,
  Warehouse, LogOut, Store, ChevronRight, Bookmark, Palette, Ruler,
  Layers, Menu, X, ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const NAV = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "VENDEDOR"] },
  { label: "Productos", href: "/admin/products", icon: Package, roles: ["ADMIN"] },
  { label: "Categorías", href: "/admin/categories", icon: Tag, roles: ["ADMIN"] },
  { label: "Secciones", href: "/admin/sections", icon: Layers, roles: ["ADMIN"] },
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

  // Desktop: collapsed/expanded. Mobile: drawer open/closed.
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Close mobile drawer on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const filteredNav = NAV.filter((n) => n.roles.includes(role));

  /* ── Shared sidebar content ─────────────────────────────────── */
  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      className={cn(
        "bg-[#1a1a2e] text-gray-300 flex flex-col min-h-full transition-all duration-300 ease-in-out",
        mobile
          ? "w-64"                             
          : collapsed ? "w-[68px]" : "w-60"    
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center border-b border-white/10 h-16 shrink-0",
          collapsed && !mobile ? "justify-center px-0" : "px-5 gap-3"
        )}
      >
        {(!collapsed || mobile) && (
          <Link href="/" className="font-brand text-xl text-[#11ABC4] truncate">
            TIBURONAZO
          </Link>
        )}

        {/* Desktop toggle button */}
        {!mobile && (
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={cn(
              "p-1.5 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-colors shrink-0",
              collapsed ? "mx-auto" : "ml-auto"
            )}
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
          </button>
        )}

        {/* Mobile close button */}
        {mobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto p-1.5 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {(!collapsed || mobile) && (
        <span className="text-[10px] text-gray-500 px-5 pb-2 pt-1 block">
          Panel Administrativo
        </span>
      )}

      {/* Nav */}
      <nav className={cn("flex-1 p-2 space-y-0.5 overflow-y-auto overflow-x-hidden")}>
        {filteredNav.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl text-sm font-medium transition-all group relative",
                collapsed && !mobile
                  ? "justify-center px-0 py-2.5 mx-1"
                  : "px-3 py-2.5",
                active
                  ? "bg-[#11ABC4] text-white"
                  : "hover:bg-white/10 text-gray-400 hover:text-white"
              )}
            >
              <item.icon size={18} className="shrink-0" />

              {(!collapsed || mobile) && (
                <>
                  <span className="truncate">{item.label}</span>
                  {active && <ChevronRight size={14} className="ml-auto shrink-0" />}
                </>
              )}

              {/* Tooltip when collapsed (desktop only) */}
              {collapsed && !mobile && (
                <span className="
                  fixed left-[68px] ml-2 px-2 py-1 rounded-md
                  bg-[#11ABC4] text-white text-xs whitespace-nowrap
                  opacity-0 pointer-events-none
                  group-hover:opacity-100 transition-opacity z-[999]
                ">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={cn("border-t border-white/10 p-2 shrink-0")}>
        {(!collapsed || mobile) && (
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-semibold text-white truncate">{userName}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wide">{role}</p>
          </div>
        )}

        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 rounded-lg text-xs text-gray-400 hover:bg-white/10 hover:text-white transition-colors group relative",
            collapsed && !mobile ? "justify-center px-0 py-2.5 mx-1" : "px-3 py-2"
          )}
        >
          <Store size={14} className="shrink-0" />
          {(!collapsed || mobile) && <span>Ver tienda</span>}
          {collapsed && !mobile && (
            <span className="absolute left-full ml-3 px-2 py-1 rounded-md bg-gray-700 text-white text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
              Ver tienda
            </span>
          )}
        </Link>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={cn(
            "flex items-center gap-2 w-full rounded-lg text-xs text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors group relative",
            collapsed && !mobile ? "justify-center px-0 py-2.5 mx-1" : "px-3 py-2"
          )}
        >
          <LogOut size={14} className="shrink-0" />
          {(!collapsed || mobile) && <span>Cerrar sesión</span>}
          {collapsed && !mobile && (
            <span className="absolute left-full ml-3 px-2 py-1 rounded-md bg-gray-700 text-white text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
              Cerrar sesión
            </span>
          )}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* ── Mobile top bar ── */}
      <div
        className="
    fixed top-0 left-0 w-full z-40
    md:hidden
    h-14 bg-[#1a1a2e] border-b border-white/10
    flex items-center justify-center
  "
      >
        {/* Botón invisible (zona clickeable izquierda) */}
        <button
          onClick={() => setMobileOpen(true)}
          className="absolute left-4 p-2"
          aria-label="Abrir menú"
        >
          <Menu size={20} className="text-[#11ABC4]" />
        </button>

        {/* Nombre centrado */}
        <span className="text-[#11ABC4] font-brand text-lg">
          TIBURONAZO
        </span>
      </div>

      {/* ── Mobile backdrop ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile drawer (slide in from left) ── */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent mobile />
      </div>

      {/* ── Desktop sidebar */}
      <div className="hidden md:flex self-stretch sticky top-0 h-screen z-[100]">
        <SidebarContent />
      </div>
    </>
  );
}