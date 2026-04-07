const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    const sections = await prisma.section.findMany();
    console.log("--- SECCIONES ACTUALES ---");
    sections.forEach(s => console.log(`ID: ${s.id} | Nombre: ${s.name} | Slug: ${s.slug} | Activo: ${s.isActive}`));
    
    const productsCount = await prisma.product.count();
    console.log(`\nTotal de productos: ${productsCount}`);
    
    const sampleProduct = await prisma.product.findFirst({
      include: { sections: true }
    });
    if (sampleProduct) {
      console.log("\n--- EJEMPLO DE PRODUCTO ---");
      console.log(`Título: ${sampleProduct.title} | Código: ${sampleProduct.code}`);
      console.log(`Género: ${sampleProduct.gender}`);
      console.log(`Secciones vinculadas: ${sampleProduct.sections.map(s => s.name).join(", ") || "Ninguna"}`);
    }
  } catch (error) {
    console.error("Error al verificar la DB:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
