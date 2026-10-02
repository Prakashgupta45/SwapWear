import { PrismaClient, Category, Condition, ListingStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SAMPLE_LISTINGS = [
  {
    title: 'Crimson Silk Wrap Midi Dress',
    description: 'Stunning 100% silk midi dress with puff sleeves and tie waist detail. Worn once for an event.',
    category: Category.DRESS,
    brand: 'REFORMATION',
    color: 'Red',
    size: 'S',
    condition: Condition.LIKE_NEW,
    estimatedSwapValue: 78,
    status: ListingStatus.AVAILABLE,
    images: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=700&q=80'],
  },
  {
    title: 'Vintage 501 Original Straight Jeans',
    description: 'Authentic 90s high-waisted wash straight leg denim with classic button fly.',
    category: Category.BOTTOMWEAR,
    brand: "LEVI'S",
    color: 'Medium Blue',
    size: '27',
    condition: Condition.GOOD,
    estimatedSwapValue: 52,
    status: ListingStatus.AVAILABLE,
    images: ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=700&q=80'],
  },
  {
    title: 'Oversized Wool Blend Trench Coat',
    description: 'Double-breasted trench in camel wool blend. Relaxed modern tailoring.',
    category: Category.OUTERWEAR,
    brand: 'ARITZIA',
    color: 'Camel',
    size: 'M',
    condition: Condition.NEW,
    estimatedSwapValue: 120,
    status: ListingStatus.AVAILABLE,
    images: ['https://images.unsplash.com/photo-1539533018447-63fcce667823?auto=format&fit=crop&w=700&q=80'],
  },
  {
    title: 'Quilted Leather Crossbody Bag',
    description: 'Burgundy pebbled leather with antique gold hardware and adjustable strap.',
    category: Category.ACCESSORIES,
    brand: 'COACH',
    color: 'Burgundy',
    size: 'One Size',
    condition: Condition.LIKE_NEW,
    estimatedSwapValue: 145,
    status: ListingStatus.AVAILABLE,
    images: ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=700&q=80'],
  },
  {
    title: 'Retro Dunk Low Streetwear Sneakers',
    description: 'Vintage colorway, lightly worn sole with original box and clean laces.',
    category: Category.FOOTWEAR,
    brand: 'NIKE',
    color: 'White/Navy',
    size: '8.5',
    condition: Condition.LIKE_NEW,
    estimatedSwapValue: 88,
    status: ListingStatus.AVAILABLE,
    images: ['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=700&q=80'],
  },
  {
    title: 'Cropped Cable-Knit Wool Sweater',
    description: 'Warm cream knit with ribbed cuffs and round neck. Perfect layer for autumn.',
    category: Category.TOPWEAR,
    brand: 'ZARA',
    color: 'Cream',
    size: 'S',
    condition: Condition.GOOD,
    estimatedSwapValue: 36,
    status: ListingStatus.AVAILABLE,
    images: ['https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=700&q=80'],
  },
  {
    title: 'Align High-Rise Yoga Leggings 25"',
    description: 'Buttery-soft Nulu fabric in graphite grey. Flattering fit and seamless waistband.',
    category: Category.BOTTOMWEAR,
    brand: 'LULULEMON',
    color: 'Graphite',
    size: '6',
    condition: Condition.LIKE_NEW,
    estimatedSwapValue: 48,
    status: ListingStatus.AVAILABLE,
    images: ['https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=700&q=80'],
  },
  {
    title: 'Embroidered Floral Boho Maxi Dress',
    description: 'Flowy tiers with vintage-inspired floral embroidery and delicate tassel ties.',
    category: Category.DRESS,
    brand: 'FREE PEOPLE',
    color: 'Ivory/Floral',
    size: 'M',
    condition: Condition.NEW,
    estimatedSwapValue: 95,
    status: ListingStatus.AVAILABLE,
    images: ['https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=700&q=80'],
  },
];

async function main() {
  console.log('Seeding SwapWear database with Poshmark style fashion items...');

  const passwordHashAdmin = await bcrypt.hash('Admin@SwapWear2026!', 12);
  const passwordHashUser = await bcrypt.hash('User@SwapWear2026!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@swapwear.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@swapwear.com',
      passwordHash: passwordHashAdmin,
      role: 'ADMIN',
      city: 'New York',
      state: 'NY',
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@swapwear.com' },
    update: {},
    create: {
      name: 'Jane Doe',
      email: 'user@swapwear.com',
      passwordHash: passwordHashUser,
      role: 'USER',
      city: 'Los Angeles',
      state: 'CA',
    },
  });

  // Seed sample fashion listings if they don't already exist
  for (const item of SAMPLE_LISTINGS) {
    const existing = await prisma.clothingListing.findFirst({
      where: { title: item.title, ownerId: user.id },
    });

    if (!existing) {
      await prisma.clothingListing.create({
        data: {
          ownerId: user.id,
          title: item.title,
          description: item.description,
          category: item.category,
          brand: item.brand,
          color: item.color,
          size: item.size,
          condition: item.condition,
          estimatedSwapValue: item.estimatedSwapValue,
          status: item.status,
          images: {
            create: item.images.map((url) => ({ imageUrl: url })),
          },
        },
      });
    }
  }

  console.log('Database seeded successfully with users and curated clothing listings:');
  console.log({
    admin: { id: admin.id, email: admin.email, role: admin.role },
    user: { id: user.id, email: user.email, role: user.role },
    listingsSeededCount: SAMPLE_LISTINGS.length,
  });
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
