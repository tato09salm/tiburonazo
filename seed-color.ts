import { prisma } from "./lib/prisma";

async function main() {
  const colorName = "Transparente";
  const hex = "transparente"; // Valor especial para identificarlo

  try {
    const existing = await prisma.color.findUnique({
      where: { name: colorName },
    });

    if (existing) {
      console.log(`El color "${colorName}" ya existe.`);
    } else {
      const color = await prisma.color.create({
        data: {
          name: colorName,
          hex: hex,
        },
      });
      console.log(`Color creado: ${color.name} (${color.hex})`);
    }
  } catch (error) {
    console.error("Error al crear el color:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
