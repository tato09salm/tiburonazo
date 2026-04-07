const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const sectionSlug = 'NIÑO';
  const categorySlug = 'ropa-de-bano'; 

  const where = {
    isActive: true,
    category: { slug: categorySlug },
    sections: {
      some: {
        OR: [
          { slug: { equals: sectionSlug, mode: "insensitive" } },
          { id: sectionSlug },
          { name: { equals: sectionSlug, mode: "insensitive" } }
        ]
      }
    }
  };

  const count = await prisma.product.count({ where });
  console.log(`Products with section=${sectionSlug} AND category=${categorySlug}: ${count}`);

  const allInSection = await prisma.product.count({
    where: {
      isActive: true,
      sections: {
        some: {
          OR: [
            { slug: { equals: sectionSlug, mode: "insensitive" } },
            { id: sectionSlug },
            { name: { equals: sectionSlug, mode: "insensitive" } }
          ]
        }
      }
    }
  });
  console.log(`Total products in section ${sectionSlug}: ${allInSection}`);

  const allProducts = await prisma.product.count({ where: { isActive: true } });
  console.log(`Total active products: ${allProducts}`);
}

test().finally(() => prisma.$disconnect());
