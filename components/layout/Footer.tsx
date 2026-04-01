import Link from "next/link";
import { Facebook, Instagram, MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="col-span-1">
          <span className="font-brand text-3xl text-[#11ABC4]">TIBURONAZO</span>
          <p className="mt-3 text-sm leading-relaxed text-gray-400">
            Equipamiento de natación y accesorios acuáticos para toda la familia.
          </p>
          <div className="flex gap-3 mt-4">
            <a href="#" className="p-2 rounded-lg bg-gray-800 hover:bg-[#11ABC4] transition-colors"><Facebook size={18} /></a>
            <a href="#" className="p-2 rounded-lg bg-gray-800 hover:bg-[#11ABC4] transition-colors"><Instagram size={18} /></a>
            <a href="https://wa.me/51999999999" className="p-2 rounded-lg bg-gray-800 hover:bg-[#25D366] transition-colors"><MessageCircle size={18} /></a>
          </div>
        </div>

        {/* Categorías */}
        <div>
          <h4 className="text-white font-semibold mb-3">Categorías</h4>
          <ul className="space-y-2 text-sm">
            {["Ropa de baño", "Jammer", "Lentes", "Gorros", "Aletas", "Parkas"].map((c) => (
              <li key={c}><Link href={`/categoria/${c.toLowerCase().replace(/ /g, "-")}`} className="hover:text-[#11ABC4] transition-colors">{c}</Link></li>
            ))}
          </ul>
        </div>

        {/* Info */}
        <div>
          <h4 className="text-white font-semibold mb-3">Información</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/nosotros" className="hover:text-[#11ABC4] transition-colors">Sobre nosotros</Link></li>
            <li><Link href="/envios" className="hover:text-[#11ABC4] transition-colors">Política de envíos</Link></li>
            <li><Link href="/devoluciones" className="hover:text-[#11ABC4] transition-colors">Devoluciones</Link></li>
            <li><Link href="/terminos" className="hover:text-[#11ABC4] transition-colors">Términos y condiciones</Link></li>
          </ul>
        </div>

        {/* Contacto */}
        <div>
          <h4 className="text-white font-semibold mb-3">Contacto</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>📍 Trujillo, La Libertad, Perú</li>
            <li>📱 WhatsApp: 999-999-999</li>
            <li>✉️ ventas@tiburonazo.pe</li>
          </ul>
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">Métodos de pago</p>
            <div className="flex gap-2 flex-wrap">
              {["Culqi", "Yape", "Plin", "Efectivo"].map((p) => (
                <span key={p} className="bg-gray-800 px-2 py-1 rounded text-xs text-gray-300">{p}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800 py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Tiburonazo. Todos los derechos reservados.
      </div>
    </footer>
  );
}
