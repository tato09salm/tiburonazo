const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sections = await prisma.section.findMany();
  for (const section of sections) {
    let newSlug = section.name.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    
    console.log(`Updating section ${section.name}: ${section.slug} -> ${newSlug}`);
    await prisma.section.update({
      where: { id: section.id },
      data: { slug: newSlug }
    });
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
