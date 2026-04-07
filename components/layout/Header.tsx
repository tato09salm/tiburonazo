"use client";

import Link from "next/link";
import { ShoppingCart, User, Search, Menu, X, Heart, Truck, Phone } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Section {
  id: string;
  name: string;
  slug: string;
  order: number;
  isActive: boolean;
  products?: Array<{
    category: {
      id: string;
      name: string;
      slug: string;
    }
  }>;
}

interface Props {
  initialSections?: Section[];
}

export function Header({ initialSections = [] }: Props) {
  const router = useRouter();
  const count = useCartStore((s) => s.count());
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  // Extraer categorías únicas para cada sección
  const menuItems = useMemo(() => {
    if (initialSections.length === 0) {
      return [
        { label: "Mujer", href: "/productos?section=mujer", sub: [] },
        { label: "Hombre", href: "/productos?section=hombre", sub: [] },
        { label: "Niño", href: "/productos?section=nino", sub: [] },
        { label: "Bebé", href: "/productos?section=bebe", sub: [] },
        { label: "Accesorios", href: "/categoria/lentes", sub: [] },
        { label: "Outlet", href: "/productos?section=outlet", sub: [] },
      ];
    }

    return initialSections.map(s => {
      // Obtener categorías únicas de los productos de esta sección
      const categoriesMap = new Map<string, { label: string, href: string }>();
      
      s.products?.forEach(p => {
        if (!categoriesMap.has(p.category.id)) {
          categoriesMap.set(p.category.id, {
            label: p.category.name,
            href: `/productos?category=${p.category.slug}&section=${s.slug}`
          });
        }
      });

      return {
        label: s.name,
        href: `/productos?section=${s.slug}`,
        sub: Array.from(categoriesMap.values())
      };
    });
  }, [initialSections]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header className={cn("sticky top-0 z-50 transition-shadow duration-300", scrolled ? "bg-white shadow-md" : "bg-white")}>
      {/* Top bar */}
      <div className="bg-[#11ABC4] text-white text-xs py-1.5 flex items-center justify-center gap-4 font-medium">
        <div className="flex items-center gap-1.5">
          <Truck size={14} />
          <span>Envíos a todo el Perú</span>
        </div>
        <span className="opacity-50">·</span>
        <div className="flex items-center gap-1.5">
          <Phone size={14} />
          <span>943-679-570</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <span className="font-brand text-3xl text-[#11ABC4] tracking-wider">TIBURONAZO</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
          {menuItems.map((item) => (
            <div
              key={item.label}
              className="relative group"
              onMouseEnter={() => setOpenGroup(item.label)}
              onMouseLeave={() => setOpenGroup(null)}
            >
              <Link
                href={item.href}
                className="px-3 py-2 text-sm font-semibold text-gray-700 hover:text-[#11ABC4] rounded-lg hover:bg-[#CCECFB] transition-colors"
              >
                {item.label}
              </Link>
              {item.sub.length > 0 && openGroup === item.label && (
                <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-lg border border-slate-100 min-w-[180px] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  {item.sub.map((s) => (
                    <Link
                      key={s.label}
                      href={s.href}
                      className="block px-4 py-2 text-sm text-gray-600 hover:bg-[#CCECFB] hover:text-[#11ABC4] font-medium transition-colors"
                    >
                      {s.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Search */}
          <div className="relative hidden md:block">
            {searchOpen ? (
              <form action="/productos" method="GET" className="flex items-center gap-2">
                <input
                  type="text"
                  name="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar productos..."
                  className="input w-48 h-9 text-sm"
                  autoFocus
                />
                <button type="button" onClick={() => setSearchOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </form>
            ) : (
              <button onClick={() => setSearchOpen(true)} className="p-2 rounded-lg hover:bg-[#CCECFB] text-gray-600 hover:text-[#11ABC4] transition-colors">
                <Search size={20} />
              </button>
            )}
          </div>

          {/* Cart */}
          <Link href="/carrito" className="relative p-2 rounded-lg hover:bg-[#CCECFB] text-gray-600 hover:text-[#11ABC4] transition-colors">
            <ShoppingCart size={20} />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#11ABC4] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </Link>

          {/* User */}
          {session ? (
            <div className="relative group">
              <button className="p-2 rounded-lg hover:bg-[#CCECFB] text-gray-600 hover:text-[#11ABC4] transition-colors">
                <User size={20} />
              </button>
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-100 min-w-[160px] py-1 z-50 hidden group-hover:block">
                <p className="px-4 py-2 text-xs text-gray-500 border-b">{session.user?.name}</p>
                {(session.user as { role?: string })?.role !== "CLIENTE" && (
                  <Link href="/admin/dashboard" className="block px-4 py-2 text-sm hover:bg-[#CCECFB] text-[#11ABC4] font-semibold">Admin Panel</Link>
                )}
                <Link href="/cuenta" className="block px-4 py-2 text-sm hover:bg-[#CCECFB]">Mi cuenta</Link>
                <button onClick={() => signOut()} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50">Cerrar sesión</button>
              </div>
            </div>
          ) : (
            <Link href="/login" className="btn-primary text-sm px-4 py-2 hidden md:inline-flex">
              Ingresar
            </Link>
          )}

          {/* Mobile menu */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-[#CCECFB] text-gray-600"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-slate-100 px-4 pb-4">
          <form action="/productos" method="GET" className="flex gap-2 py-3">
            <input type="text" name="search" placeholder="Buscar..." className="input h-9 text-sm flex-1" />
            <button type="submit" className="btn-primary px-3 py-2"><Search size={16} /></button>
          </form>
          <nav className="flex flex-col gap-1">
            {menuItems.map((g) => (
              <div key={g.label} className="flex flex-col">
                <Link href={g.href} className="py-2.5 px-3 rounded-lg font-semibold text-gray-700 hover:bg-[#CCECFB] hover:text-[#11ABC4]" onClick={() => setMobileOpen(false)}>
                  {g.label}
                </Link>
                {g.sub.length > 0 && (
                  <div className="flex flex-col ml-4 border-l border-slate-100 pl-2">
                    {g.sub.map((s) => (
                      <Link key={s.label} href={s.href} className="py-2 px-3 text-sm text-gray-500 hover:text-[#11ABC4]" onClick={() => setMobileOpen(false)}>
                        {s.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {!session && <Link href="/login" className="btn-primary text-center mt-2" onClick={() => setMobileOpen(false)}>Ingresar</Link>}
          </nav>
        </div>
      )}
    </header>
  );
}
