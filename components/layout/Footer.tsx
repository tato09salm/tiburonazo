"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Facebook, Instagram, MessageCircle, MapPin, Phone, Mail,
  CreditCard, Smartphone, Banknote, QrCode, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";

const PAYMENTS = [
  { name: "Visa/Mastercard", icon: CreditCard, color: "hover:text-blue-400" },
  { name: "Yape", icon: Smartphone, color: "hover:text-purple-400" },
  { name: "Plin", icon: QrCode, color: "hover:text-cyan-400" },
  { name: "Efectivo", icon: Banknote, color: "hover:text-green-400" },
];

export function Footer() {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <footer className="bg-gray-900 text-gray-300 mt-16 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* --- BRAND / LOGO --- */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="mb-4">
              <Image
                src="/logo3.png"
                alt="Tiburonazo Logo"
                width={160}
                height={51}
                className="object-contain h-auto"
              />
            </div>
            <p className="text-sm leading-relaxed text-gray-400 max-w-xs">
              Equipamiento de natación y accesorios acuáticos de alta calidad para toda la familia.
            </p>
            <div className="flex gap-4 mt-6">
              <a href="https://web.facebook.com/tiburonazoo" target="_blank" className="p-2.5 rounded-full bg-gray-800 hover:bg-[#11ABC4] transition-all transform hover:scale-110">
                <Facebook size={20} />
              </a>
              <a href="https://www.instagram.com/tiburonazoo/" target="_blank" className="p-2.5 rounded-full bg-gray-800 hover:bg-[#11ABC4] transition-all transform hover:scale-110">
                <Instagram size={20} />
              </a>
              <a href="https://wa.me/51943679570" target="_blank" className="p-2.5 rounded-full bg-gray-800 hover:bg-[#25D366] transition-all transform hover:scale-110">
                <MessageCircle size={20} />
              </a>
            </div>
          </div>

          {/* --- CATEGORÍAS (ACORDEÓN EN MÓVIL) --- */}
          <div className="border-b border-gray-800 md:border-none">
            <button
              onClick={() => toggleSection('cats')}
              className="w-full flex items-center justify-between py-4 md:py-0 md:cursor-default"
            >
              <h4 className="text-white font-bold uppercase tracking-wider text-sm">Categorías</h4>
              <ChevronDown size={18} className={cn("transition-transform md:hidden", openSection === 'cats' && "rotate-180")} />
            </button>
            <ul className={cn(
              "space-y-3 text-sm mt-2 md:mt-4 overflow-hidden transition-all duration-300 pb-4 md:pb-0",
              openSection === 'cats' ? "max-h-96 opacity-100" : "max-h-0 opacity-0 md:max-h-none md:opacity-100"
            )}>
              {["Ropa de baño", "Jammer", "Lentes", "Gorros", "Aletas", "Parkas"].map((c) => (
                <li key={c}>
                  <Link href={`/categoria/${c.toLowerCase().replace(/ /g, "-")}`} className="hover:text-[#11ABC4] py-1 block transition-colors">
                    {c}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* --- INFORMACIÓN (ACORDEÓN EN MÓVIL) --- */}
          <div className="border-b border-gray-800 md:border-none">
            <button
              onClick={() => toggleSection('info')}
              className="w-full flex items-center justify-between py-4 md:py-0 md:cursor-default"
            >
              <h4 className="text-white font-bold uppercase tracking-wider text-sm">Información</h4>
              <ChevronDown size={18} className={cn("transition-transform md:hidden", openSection === 'info' && "rotate-180")} />
            </button>
            <ul className={cn(
              "space-y-3 text-sm mt-2 md:mt-4 overflow-hidden transition-all duration-300 pb-4 md:pb-0",
              openSection === 'info' ? "max-h-96 opacity-100" : "max-h-0 opacity-0 md:max-h-none md:opacity-100"
            )}>
              <li><Link href="/nosotros" className="hover:text-[#11ABC4] py-1 block transition-colors">Sobre nosotros</Link></li>
              <li><Link href="/envios" className="hover:text-[#11ABC4] py-1 block transition-colors">Política de envíos</Link></li>
              <li><Link href="/devoluciones" className="hover:text-[#11ABC4] py-1 block transition-colors">Devoluciones</Link></li>
              <li><Link href="/terminos" className="hover:text-[#11ABC4] py-1 block transition-colors">Términos y condiciones</Link></li>
            </ul>
          </div>

          {/* --- CONTACTO --- */}
          <div className="pt-4 md:pt-0">
            <h4 className="text-white font-bold uppercase tracking-wider text-sm mb-4">Contacto</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-[#11ABC4] shrink-0" />
                <span>Trujillo, La Libertad, Perú</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-[#11ABC4] shrink-0" />
                <a href="tel:+51943679570" className="hover:text-white transition-colors">943-679-570</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-[#11ABC4] shrink-0" />
                <a href="mailto:tiburonazonatacion@gmail.com" className="hover:text-white transition-colors break-all">
                  tiburonazonatacion@gmail.com
                </a>
              </li>
            </ul>

            {/* MÉTODOS DE PAGO */}
            <div className="mt-8">
              <p className="text-[10px] font-black text-gray-500 mb-4 uppercase tracking-[0.2em]">Métodos de pago</p>
              <div className="flex gap-2 flex-wrap">
                {PAYMENTS.map((p) => (
                  <div
                    key={p.name}
                    className="flex items-center justify-center bg-gray-800/40 border border-gray-700/50 p-2 rounded-md hover:border-[#11ABC4]/50 transition-all"
                    title={p.name}
                  >
                    <p.icon size={16} className="text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- COPYRIGHT --- */}
      <div className="border-t border-gray-800 py-8 px-6">
        <div className="max-w-7xl mx-auto text-center text-[11px] font-medium tracking-wide uppercase">
          <p>© {new Date().getFullYear()} TIBURONAZO.</p>
        </div>
      </div>
    </footer>
  );
}