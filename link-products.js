const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando vinculación de productos con secciones...");

  try {
    const sections = await prisma.section.findMany();
    const findSection = (name) => sections.find(s => s.name.toLowerCase() === name.toLowerCase());

    const sMujer = findSection("Mujer");
    const sHombre = findSection("Hombre");
    const sNino = findSection("Niño");
    const sNina = findSection("Niña");
    const sBebe = findSection("Bebé");

    const products = await prisma.product.findMany();

    for (const product of products) {
      let sectionIds = [];

      if (product.gender === "ADULTO") {
        if (sMujer) sectionIds.push(sMujer.id);
        if (sHombre) sectionIds.push(sHombre.id);
      } else if (product.gender === "NINO") {
        if (sNino) sectionIds.push(sNino.id);
        if (sNina) sectionIds.push(sNina.id);
      } else if (product.gender === "BEBE") {
        if (sBebe) sectionIds.push(sBebe.id);
      } else if (product.gender === "UNISEX") {
        // Vincular a todos los relevantes
        if (sMujer) sectionIds.push(sMujer.id);
        if (sHombre) sectionIds.push(sHombre.id);
        if (sNino) sectionIds.push(sNino.id);
        if (sNina) sectionIds.push(sNina.id);
      }

      if (sectionIds.length > 0) {
        // Intentar vincular (manejo de compatibilidad)
        try {
          await prisma.product.update({
            where: { id: product.id },
            data: {
              sections: {
                connect: sectionIds.map(id => ({ id }))
              }
            }
          });
          console.log(`Producto "${product.title}" vinculado a: ${sectionIds.length} secciones.`);
        } catch (e) {
          // Si falla por 'sections' plural, intentar singular 'sectionId' (solo el primero)
          try {
            await prisma.product.update({
              where: { id: product.id },
              data: { sectionId: sectionIds[0] }
            });
            console.log(`Producto "${product.title}" vinculado a sección ID: ${sectionIds[0]} (fallback singular).`);
          } catch (e2) {
            console.log(`No se pudo vincular "${product.title}": el esquema de la DB no coincide.`);
          }
        }
      }
    }

    console.log("\nProceso de vinculación finalizado.");
  } catch (error) {
    console.error("Error en el script:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
