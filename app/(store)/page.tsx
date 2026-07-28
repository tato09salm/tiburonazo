import { Suspense } from "react";
import { getProducts } from "@/actions/product.actions";
import { getActiveHeroSlides } from "@/actions/hero.actions";
import { ProductCardComponent } from "@/components/store/product-card";
import { ProductGridSkeleton } from "@/components/common/Skeleton";
import { HeroSlider } from "@/components/hero/HeroSlider";
import Link from "next/link";
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

export default async function HomePage() {
  const heroSlides = await getActiveHeroSlides();

  return (
    <div>
      {/* Hero Banner */}
      <HeroSlider slides={heroSlides as any} />

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
