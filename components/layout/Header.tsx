"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, User, Search, Menu, X, Truck, Phone } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
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

  // Estados para UI
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  // Fix de Hidratación: Asegura que el cliente coincida con el servidor al inicio
  useEffect(() => {
    setMounted(true);
  }, []);

  // Manejo de scroll para sombra en el header
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Generación de items de menú basados en secciones de la DB o fallback
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

  return (
    <header className={cn(
      "sticky top-0 z-50 transition-all duration-300", 
      scrolled ? "bg-white shadow-md" : "bg-white"
    )}>
      {/* Top bar informativa */}
      <div className="bg-[#11ABC4] text-white text-sm py-1.5 flex items-center justify-center gap-4 font-medium">
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

      {/* Contenedor Principal */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between lg:justify-start gap-4">
        
        {/* 1. Botón Hamburguesa (Móvil) */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 rounded-lg hover:bg-[#CCECFB] text-gray-600 order-1"
          aria-label="Menu"
        >
          {mobileOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* 2. Logo */}
        <Link href="/" className="absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0 flex items-center">
          <Image 
            src="/logo.png" 
            alt="Tiburonazo Logo" 
            width={160} 
            height={47} 
            className="hidden lg:block object-contain "
            priority 
          />
          <Image 
            src="/logo2.png" 
            alt="Tiburonazo Logo" 
            width={90} 
            height={44} 
            className="lg:hidden object-contain"
            priority 
          />
        </Link>

        {/* 3. Desktop Nav (Centro) */}
        <nav className="hidden lg:flex items-center gap-2 flex-1 justify-center">
          {menuItems.map((item) => (
            <div
              key={item.label}
              className="relative group"
              onMouseEnter={() => setOpenGroup(item.label)}
              onMouseLeave={() => setOpenGroup(null)}
            >
              <Link
                href={item.href}
                className="px-3 py-2 text-base font-bold text-gray-800 hover:text-[#11ABC4] rounded-lg hover:bg-[#CCECFB] transition-all"
              >
                {item.label}
              </Link>
              {item.sub.length > 0 && openGroup === item.label && (
                <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-lg border border-slate-100 min-w-[200px] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
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

        {/* 4. Acciones (Derecha) */}
        <div className="flex items-center gap-1 md:gap-2 order-3 lg:order-none">
          {/* Buscador Desktop */}
          <div className="relative hidden md:block">
            {searchOpen ? (
              <form action="/productos" method="GET" className="flex items-center gap-2">
                <input
                  type="text"
                  name="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="input w-40 h-9 text-sm"
                  autoFocus
                />
                <button type="button" onClick={() => setSearchOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </form>
            ) : (
              <button onClick={() => setSearchOpen(true)} className="p-2 rounded-lg hover:bg-[#CCECFB] text-gray-600 hover:text-[#11ABC4] transition-colors">
                <Search size={22} />
              </button>
            )}
          </div>

          {/* Carrito con Fix de Hidratación */}
          <Link href="/carrito" className="relative p-2 rounded-lg hover:bg-[#CCECFB] text-gray-600 hover:text-[#11ABC4] transition-colors">
            <ShoppingCart size={26} />
            {mounted && count > 0 && (
              <span className="absolute top-0 right-0 bg-[#11ABC4] text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-white animate-in zoom-in duration-300">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </Link>

          {/* Usuario / Sesión */}
          {session ? (
            <div className="relative group">
              <button className="p-2 rounded-lg hover:bg-[#CCECFB] text-gray-600 hover:text-[#11ABC4] transition-colors">
                <User size={26} />
              </button>
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-100 min-w-[160px] py-1 z-50 hidden group-hover:block">
                <p className="px-4 py-2 text-xs text-gray-500 border-b">{session.user?.name}</p>
                {(session.user as any)?.role !== "CLIENTE" && (
                  <Link href="/admin/dashboard" className="block px-4 py-2 text-sm hover:bg-[#CCECFB] text-[#11ABC4] font-semibold">Admin Panel</Link>
                )}
                <Link href="/cuenta" className="block px-4 py-2 text-sm hover:bg-[#CCECFB]">Mi cuenta</Link>
                <button onClick={() => signOut()} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50">Cerrar sesión</button>
              </div>
            </div>
          ) : (
            <Link href="/login" className="hidden md:inline-flex btn-primary text-sm px-4 py-2">
              Ingresar
            </Link>
          )}
        </div>
      </div>

      {/* Menú Móvil */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-slate-100 px-4 pb-6 animate-in slide-in-from-left duration-300">
          <form action="/productos" method="GET" className="flex gap-2 py-4">
            <input 
              type="text" 
              name="search" 
              placeholder="Buscar productos..." 
              className="input h-10 text-sm flex-1" 
            />
            <button type="submit" className="bg-[#11ABC4] text-white rounded-lg px-4 py-2">
              <Search size={18} />
            </button>
          </form>
          <nav className="flex flex-col gap-1">
            {menuItems.map((g) => (
              <div key={g.label} className="flex flex-col border-b border-slate-50 last:border-0">
                <Link 
                  href={g.href} 
                  className="py-3 px-2 rounded-lg font-bold text-gray-800 text-lg hover:text-[#11ABC4]" 
                  onClick={() => setMobileOpen(false)}
                >
                  {g.label}
                </Link>
                {g.sub.length > 0 && (
                  <div className="flex flex-col ml-4 mb-2 border-l-2 border-[#CCECFB] pl-3">
                    {g.sub.map((s) => (
                      <Link 
                        key={s.label} 
                        href={s.href} 
                        className="py-2 text-base text-gray-600 hover:text-[#11ABC4]" 
                        onClick={() => setMobileOpen(false)}
                      >
                        {s.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {!session && (
              <Link href="/login" className="btn-primary text-center mt-4 py-3" onClick={() => setMobileOpen(false)}>
                Ingresar a mi cuenta
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}