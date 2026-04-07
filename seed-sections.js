const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const sections = [
    { name: "Mujer", slug: "/productos?gender=ADULTO", order: 1 },
    { name: "Hombre", slug: "/productos?gender=ADULTO", order: 2 },
    { name: "Niño", slug: "/productos?gender=NINO", order: 3 },
    { name: "Niña", slug: "/productos?gender=NINO", order: 4 },
    { name: "Bebé", slug: "/productos?gender=BEBE", order: 5 },
    { name: "Accesorios", slug: "/categoria/lentes", order: 6 },
    { name: "Outlet", slug: "/productos?outlet=true", order: 7 },
  ];

  console.log("Iniciando seed de secciones...");

  try {
    for (const section of sections) {
      await prisma.section.upsert({
        where: { name: section.name },
        update: {
          slug: section.slug,
          order: section.order,
          isActive: true
        },
        create: {
          name: section.name,
          slug: section.slug,
          order: section.order,
          isActive: true
        },
      });
      console.log(`Sección procesada: ${section.name}`);
    }
    console.log("Seed de secciones completado con éxito.");
  } catch (error) {
    console.error("Error al poblar secciones:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
