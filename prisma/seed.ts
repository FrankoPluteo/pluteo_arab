import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const dior = await prisma.brand.create({
    data: {
      name: 'Dior',
      description: 'French luxury fashion house',
      websiteUrl: 'https://www.dior.com',
      logoUrl: '/brands/dior.png',
    },
  });

  const chanel = await prisma.brand.create({
    data: {
      name: 'Chanel',
      description: 'Iconic French luxury brand',
      websiteUrl: 'https://www.chanel.com',
      logoUrl: '/brands/chanel.png',
    },
  });

  await prisma.product.createMany({
    data: [
      {
        name: 'Sauvage',
        brandId: dior.id,
        size: 100,
        price: 120,
        images: ['/products/sauvage-1.jpg'],
        concentration: 'Eau de Parfum',
        gender: 'Men',
        description: 'A fresh and woody fragrance.',
        isFeatured: true,
        isBestSeller: true,
        stock: 50,
        topNotes: ['Calabrian Bergamot', 'Pepper'],
        heartNotes: ['Sichuan Pepper', 'Lavender'],
        baseNotes: ['Ambroxan', 'Cedar'],
      },
      {
        name: 'Bleu de Chanel',
        brandId: chanel.id,
        size: 100,
        price: 135,
        images: ['/products/bleu-1.jpg'],
        concentration: 'Eau de Toilette',
        gender: 'Men',
        description: 'A woody aromatic fragrance.',
        discountAmount: 10,
        isFeatured: true,
        stock: 30,
        topNotes: ['Grapefruit', 'Lemon', 'Mint'],
        heartNotes: ['Ginger', 'Jasmine'],
        baseNotes: ['Incense', 'Cedar'],
      },
    ],
  });

  console.log('Seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });