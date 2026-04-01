import { Suspense } from "react";
import { getProducts } from "@/actions/product.actions";
import { getCategories } from "@/actions/category.actions";
import { ProductCardComponent } from "@/components/store/product-card";
import { ProductGridSkeleton } from "@/components/common/Skeleton";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Zap, Truck, RotateCcw, ShieldCheck } from "lucide-react";

const FEATURES = [
  { icon: Truck, label: "Envíos a todo el Perú" },
  { icon: RotateCcw, label: "Devoluciones fáciles" },
  { icon: ShieldCheck, label: "Compra segura" },
  { icon: Zap, label: "Atención rápida" },
];

const CATEGORY_HIGHLIGHTS = [
  { name: "Competencia", slug: "jammer", emoji: "🏆", color: "from-blue-600 to-[#11ABC4]" },
  { name: "Entrenamiento", slug: "ropa-de-bano", emoji: "💪", color: "from-[#11ABC4] to-[#00D4DD]" },
  { name: "Accesorios", slug: "lentes", emoji: "🥽", color: "from-[#00D4DD] to-cyan-300" },
  { name: "Aguas Abiertas", slug: "traje-de-agua", emoji: "🌊", color: "from-cyan-600 to-blue-800" },
  { name: "Náuticos", slug: "conjuntos", emoji: "⛵", color: "from-indigo-600 to-blue-600" },
  { name: "Personalizados", slug: "personalizados", emoji: "✨", color: "from-purple-500 to-[#11ABC4]" },
];

async function FeaturedProducts() {
  const { products } = await getProducts({ featured: true, limit: 8 });
  if (!products.length) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {products.map((p) => (
        <ProductCardComponent key={p.id} product={p} />
      ))}
    </div>
  );
}

async function NewArrivals() {
  const { products } = await getProducts({ limit: 4 });
  if (!products.length) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {products.map((p) => (
        <ProductCardComponent key={p.id} product={p} />
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div>
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-[#1a1a2e] via-[#0d2a3a] to-[#0d8fa6] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-[#11ABC4] blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-[#00D4DD] blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 text-center md:text-left">
            <span className="inline-block bg-[#11ABC4]/20 border border-[#11ABC4]/40 text-[#CCECFB] text-xs font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
              Nueva colección 2026
            </span>
            <h1 className="font-brand text-5xl md:text-7xl font-bold leading-tight mb-4">
              NADA SIN <br />
              <span className="text-[#11ABC4]">LÍMITES</span>
            </h1>
            <p className="text-gray-300 text-lg mb-8 max-w-lg">
              Equípate con lo mejor en ropa de natación, accesorios y más. Para adultos, niños y bebés.
            </p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <Link href="/productos" className="btn-primary text-base px-8 py-3 inline-flex items-center gap-2">
                Ver colección <ArrowRight size={18} />
              </Link>
              <Link href="/categoria/personalizados" className="btn-secondary text-base px-8 py-3 bg-transparent border-white text-white hover:bg-white/10">
                Personalizados
              </Link>
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="relative w-72 h-72 md:w-96 md:h-96">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#11ABC4]/30 to-[#00D4DD]/20 animate-pulse" />
              <div className="absolute inset-8 rounded-full bg-[#11ABC4]/10 border border-[#11ABC4]/30 flex items-center justify-center text-8xl">
                🦈
              </div>
            </div>
          </div>
        </div>
        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L60 50C120 40 240 20 360 15C480 10 600 20 720 25C840 30 960 30 1080 25C1200 20 1320 10 1380 5L1440 0V60H0Z" fill="#f8fbff" />
          </svg>
        </div>
      </section>

      {/* Features strip */}
      <section className="bg-[#f8fbff] py-6 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FEATURES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 justify-center md:justify-start">
                <div className="w-10 h-10 rounded-xl bg-[#CCECFB] flex items-center justify-center text-[#11ABC4] flex-shrink-0">
                  <Icon size={20} />
                </div>
                <span className="text-sm font-semibold text-gray-700">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category grid */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title">Explora por categoría</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {CATEGORY_HIGHLIGHTS.map((cat) => (
            <Link
              key={cat.slug}
              href={`/categoria/${cat.slug}`}
              className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${cat.color} p-6 text-white min-h-[120px] flex flex-col justify-end hover:shadow-lg transition-shadow`}
            >
              <div className="absolute top-4 right-4 text-4xl opacity-80 group-hover:scale-110 transition-transform">
                {cat.emoji}
              </div>
              <h3 className="font-heading text-xl font-bold">{cat.name}</h3>
              <span className="text-xs text-white/70 flex items-center gap-1 mt-1">
                Ver productos <ArrowRight size={12} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title">Destacados</h2>
          <Link href="/productos?featured=true" className="text-[#11ABC4] text-sm font-semibold hover:underline flex items-center gap-1">
            Ver todos <ArrowRight size={14} />
          </Link>
        </div>
        <Suspense fallback={<ProductGridSkeleton count={8} />}>
          <FeaturedProducts />
        </Suspense>
      </section>

      {/* Promo banner */}
      <section className="bg-gradient-to-r from-[#11ABC4] to-[#00D4DD] text-white py-12 my-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="font-brand text-4xl font-bold">¿Buscas algo personalizado?</h2>
            <p className="mt-2 text-white/80">Uniformes de equipo, bordados, sublimados y más.</p>
          </div>
          <Link href="/categoria/personalizados" className="bg-white text-[#11ABC4] font-bold px-8 py-3 rounded-xl hover:shadow-lg transition-shadow flex-shrink-0">
            Cotizar ahora
          </Link>
        </div>
      </section>

      {/* New arrivals */}
      <section className="max-w-7xl mx-auto px-4 py-8 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title">Recién llegados</h2>
          <Link href="/productos" className="text-[#11ABC4] text-sm font-semibold hover:underline flex items-center gap-1">
            Ver todos <ArrowRight size={14} />
          </Link>
        </div>
        <Suspense fallback={<ProductGridSkeleton count={4} />}>
          <NewArrivals />
        </Suspense>
      </section>
    </div>
  );
}
