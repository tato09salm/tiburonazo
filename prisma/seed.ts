import { PrismaClient, Gender, MoveType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: "Ropa de baño", slug: "ropa-de-bano" },
  { name: "Jammer", slug: "jammer" },
  { name: "Enterizos", slug: "enterizos" },
  { name: "Polos", slug: "polos" },
  { name: "Atletic", slug: "atletic" },
  { name: "Conjuntos", slug: "conjuntos" },
  { name: "Traje de agua", slug: "traje-de-agua" },
  { name: "Parkas", slug: "parkas" },
  { name: "Vinchas", slug: "vinchas" },
  { name: "Lentes", slug: "lentes" },
  { name: "Gorros", slug: "gorros" },
  { name: "Aletas", slug: "aletas" },
  { name: "Personalizados", slug: "personalizados" },
  { name: "Peluches", slug: "peluches" },
  { name: "Disfraces", slug: "disfraces" },
  { name: "Ponchos", slug: "ponchos" },
  { name: "Neceser", slug: "neceser" },
  { name: "Batas", slug: "batas" },
];

// Productos extraídos del archivo Excel (Nuevo_cuadre_de_Inventario)
const PRODUCTS_FROM_EXCEL = [
  { code: "P001", name: "ROPA DE BAÑO", categorySlug: "ropa-de-bano", gender: "ADULTO" as Gender },
  { code: "P002", name: "JAMMER", categorySlug: "jammer", gender: "ADULTO" as Gender },
  { code: "P003", name: "ENTERIZO", categorySlug: "enterizos", gender: "ADULTO" as Gender },
  { code: "P004", name: "POLO", categorySlug: "polos", gender: "UNISEX" as Gender },
  { code: "P005", name: "ATLETIC", categorySlug: "atletic", gender: "ADULTO" as Gender },
  { code: "P006", name: "CONJUNTO", categorySlug: "conjuntos", gender: "ADULTO" as Gender },
  { code: "P007", name: "TRAJE DE AGUA", categorySlug: "traje-de-agua", gender: "ADULTO" as Gender },
  { code: "P008", name: "PARKA", categorySlug: "parkas", gender: "UNISEX" as Gender },
  { code: "P009", name: "VINCHA", categorySlug: "vinchas", gender: "UNISEX" as Gender },
  { code: "P010", name: "LENTE COMPETENCIA", categorySlug: "lentes", gender: "ADULTO" as Gender },
  { code: "P011", name: "LENTE ENTRENAMIENTO", categorySlug: "lentes", gender: "ADULTO" as Gender },
  { code: "P012", name: "GORRO SILICONA", categorySlug: "gorros", gender: "UNISEX" as Gender },
  { code: "P013", name: "GORRO TELA", categorySlug: "gorros", gender: "UNISEX" as Gender },
  { code: "P014", name: "ALETA ENTRENAMIENTO", categorySlug: "aletas", gender: "ADULTO" as Gender },
  { code: "P015", name: "ALETA NATACIÓN", categorySlug: "aletas", gender: "UNISEX" as Gender },
  { code: "P016", name: "PERSONALIZADO SUBLIMADO", categorySlug: "personalizados", gender: "UNISEX" as Gender },
  { code: "P017", name: "PELUCHE TIBURÓN", categorySlug: "peluches", gender: "UNISEX" as Gender },
  { code: "P018", name: "DISFRAZ TIBURÓN", categorySlug: "disfraces", gender: "UNISEX" as Gender },
  { code: "P019", name: "PONCHO TOALLA", categorySlug: "ponchos", gender: "UNISEX" as Gender },
  { code: "P020", name: "NECESER NATACIÓN", categorySlug: "neceser", gender: "UNISEX" as Gender },
  { code: "P021", name: "BATA SOFTSHELL", categorySlug: "batas", gender: "ADULTO" as Gender },
  { code: "P022", name: "ROPA DE BAÑO NIÑA", categorySlug: "ropa-de-bano", gender: "NINO" as Gender },
  { code: "P023", name: "ROPA DE BAÑO NIÑO", categorySlug: "ropa-de-bano", gender: "NINO" as Gender },
  { code: "P024", name: "ROPA DE BAÑO BEBÉ", categorySlug: "ropa-de-bano", gender: "BEBE" as Gender },
  { code: "P025", name: "CONJUNTO NIÑO", categorySlug: "conjuntos", gender: "NINO" as Gender },
  { code: "P026", name: "GORRO PORTO", categorySlug: "gorros", gender: "UNISEX" as Gender },
  { code: "P027", name: "LENTE WINNER ESPEJO", categorySlug: "lentes", gender: "ADULTO" as Gender },
  { code: "P028", name: "PARKA SOFTSHELL", categorySlug: "parkas", gender: "ADULTO" as Gender },
];

const SIZES_BY_CATEGORY: Record<string, string[]> = {
  "ropa-de-bano": ["4", "6", "8", "10", "12", "14", "16", "S", "M", "L", "XL"],
  "jammer": ["10", "12", "14", "16", "S", "M", "L", "XL"],
  "enterizos": ["S", "M", "L", "XL", "XXL"],
  "parkas": ["XS", "S", "M", "L", "XL", "XXL"],
  "batas": ["S", "M", "L", "XL"],
  "gorros": ["ÚNICO"],
  "lentes": ["ÚNICO"],
  "aletas": ["XS", "S", "M", "L", "XL"],
  "vinchas": ["ÚNICO"],
  "default": ["ÚNICO"],
};

const COLORS = [
  { name: "Negro", hex: "#000000" },
  { name: "Azul Marino", hex: "#000080" },
  { name: "Rojo", hex: "#FF0000" },
  { name: "Verde", hex: "#008000" },
  { name: "Amarillo", hex: "#FFFF00" },
  { name: "Blanco", hex: "#FFFFFF" },
  { name: "Cyan", hex: "#00FFFF" },
  { name: "Rosa", hex: "#FFC0CB" },
];

const PRICES_BY_CATEGORY: Record<string, { price: number; oldPrice?: number }> = {
  "ropa-de-bano": { price: 45, oldPrice: 55 },
  "jammer": { price: 65 },
  "enterizos": { price: 75, oldPrice: 90 },
  "parkas": { price: 120, oldPrice: 150 },
  "batas": { price: 180 },
  "gorros": { price: 30 },
  "lentes": { price: 45, oldPrice: 60 },
  "aletas": { price: 55 },
  "vinchas": { price: 15 },
  "personalizados": { price: 80 },
  "peluches": { price: 35 },
  "disfraces": { price: 90 },
  "ponchos": { price: 60 },
  "neceser": { price: 25 },
  "default": { price: 50 },
};

async function main() {
  console.log("🌱 Iniciando seed de Tiburonazo...");

  // 1. Categorías
  console.log("📁 Creando categorías...");
  const categoryMap: Record<string, string> = {};
  for (const cat of CATEGORIES) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { name: cat.name, slug: cat.slug },
    });
    categoryMap[cat.slug] = created.id;
  }

  // 2. Tiendas (del Excel)
  console.log("🏪 Creando tiendas...");
  const stores = ["SAGRADO CORAZÓN", "BERENDSON", "CLARETIANO"];
  const storeMap: Record<string, string> = {};
  for (const name of stores) {
    const s = await prisma.store.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    storeMap[name] = s.id;
  }
  
  // 3. Admin user
  console.log("👤 Creando usuarios...");
  const adminPass = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@tiburonazo.pe" },
    update: {},
    create: { name: "Administrador", email: "admin@tiburonazo.pe", password: adminPass, role: "ADMIN" },
  });

  const vendedorPass = await bcrypt.hash("vendedor123", 10);
  await prisma.user.upsert({
    where: { email: "vendedor@tiburonazo.pe" },
    update: {},
    create: { name: "Sr. Andree", email: "vendedor@tiburonazo.pe", password: vendedorPass, role: "VENDEDOR" },
  });

  const clientePass = await bcrypt.hash("cliente123", 10);
  await prisma.user.upsert({
    where: { email: "cliente@tiburonazo.pe" },
    update: {},
    create: { name: "Cliente Demo", email: "cliente@tiburonazo.pe", password: clientePass, role: "CLIENTE" },
  });

  // 4. Colores y Tallas
  console.log("🎨 Creando colores...");
  const colorMap: Record<string, string> = {};
  for (const c of COLORS) {
    const created = await prisma.color.upsert({
      where: { name: c.name },
      update: {},
      create: { name: c.name, hex: c.hex },
    });
    colorMap[c.name] = created.id;
  }

  console.log("📏 Creando tallas...");
  const sizeMap: Record<string, string> = {};
  const allSizes = Array.from(new Set(Object.values(SIZES_BY_CATEGORY).flat()));
  for (const label of allSizes) {
    if (label === "ÚNICO") continue;
    const created = await prisma.size.upsert({
      where: { label },
      update: {},
      create: { label, category: "default" },
    });
    sizeMap[label] = created.id;
  }

  // 5. Productos con variantes (del Excel)
  console.log("📦 Creando productos...");
  for (const prod of PRODUCTS_FROM_EXCEL) {
    const catId = categoryMap[prod.categorySlug];
    if (!catId) continue;

    const slug = `${prod.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${prod.code}`;
    const sizes = SIZES_BY_CATEGORY[prod.categorySlug] ?? SIZES_BY_CATEGORY["default"];
    const { price, oldPrice } = PRICES_BY_CATEGORY[prod.categorySlug] ?? PRICES_BY_CATEGORY["default"];

    try {
      const existing = await prisma.product.findUnique({ where: { code: prod.code } });
      if (existing) continue;

      const colors = Object.values(colorMap).slice(0, 3); // Tomar 3 colores para cada producto

      await prisma.product.create({
        data: {
          code: prod.code,
          title: prod.name,
          slug,
          gender: prod.gender,
          categoryId: catId,
          isFeatured: ["P001", "P002", "P010", "P012", "P027"].includes(prod.code),
          variants: {
            create: sizes.flatMap((size) => colors.map((colorId, i) => ({
              sku: `${prod.code}-${size}-${i}`,
              sizeId: size === "ÚNICO" ? null : sizeMap[size],
              colorId,
              price,
              oldPrice: oldPrice ?? null,
              stock: Math.floor(Math.random() * 15) + 2,
            }))),
          },
        },
      });
    } catch (e) {
      console.error(`Error creando ${prod.code}:`, e);
    }
  }

  // 6. Inventario inicial
  console.log("📊 Cargando inventario inicial...");
  const variants = await prisma.productVariant.findMany({ take: 20 });

  if (variants.length) {
    for (const v of variants.slice(0, 10)) {
      await prisma.inventoryMove.upsert({
        where: { code: `INV-INIT-${v.id}` },
        update: {},
        create: {
          code: `INV-INIT-${v.id}`,
          type: MoveType.ENTRADA,
          quantity: v.stock,
          stockAfter: v.stock, 
          reason: "INICIAL",
          variantId: v.id,
          date: new Date("2026-02-24"),
        },
      });
    }
  }

  console.log("✅ Seed completado exitosamente!");
  console.log("\n📋 Credenciales:");
  console.log("  Admin:    admin@tiburonazo.pe / admin123");
  console.log("  Vendedor: vendedor@tiburonazo.pe / vendedor123");
  console.log("  Cliente:  cliente@tiburonazo.pe / cliente123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
