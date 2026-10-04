import { PrismaClient, Category, Condition, ListingStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SAMPLE_LISTINGS = [
  // ── 1. Women ─────────────────────────────────────────────────────────────
  {
    title: "Women's Crimson Silk Wrap Midi Dress",
    description: "Stunning women's 100% silk midi dress with puff sleeves and tie waist detail. Worn once for an event.",
    category: Category.DRESS,
    brand: 'REFORMATION',
    color: 'Red',
    size: 'S',
    condition: Condition.LIKE_NEW,
    estimatedSwapValue: 78,
    status: ListingStatus.AVAILABLE,
    images: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80'],
  },
  {
    title: "Women's Cropped Cable-Knit Wool Sweater",
    description: "Warm cream women's knit with ribbed cuffs and round neck. Perfect layer for autumn.",
    category: Category.TOPWEAR,
    brand: 'ZARA',
    color: 'Cream',
    size: 'M',
    condition: Condition.GOOD,
    estimatedSwapValue: 36,
    status: ListingStatus.AVAILABLE,
    images: ['https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80'],
  },

  // ── 2. Men ───────────────────────────────────────────────────────────────
  {
    title: "Men's Distressed Vintage Leather Biker Jacket",
    description: "Premium men's vintage brown lambskin biker jacket with heavy brass zippers and quilted satin lining.",
    category: Category.OUTERWEAR,
    brand: 'SCHOTT NYC',
    color: 'Brown',
    size: 'L',
    condition: Condition.LIKE_NEW,
    estimatedSwapValue: 180,
    status: ListingStatus.AVAILABLE,
    images: ['https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?auto=format&fit=crop&w=800&q=80'],
  },
  {
    title: "Men's Classic Oxford Tailored Shirt",
    description: "Crisp men's formal dress shirt in sky blue woven cotton with mother-of-pearl buttons.",
    category: Category.TOPWEAR,
    brand: 'RALPH LAUREN',
    color: 'Sky Blue',
    size: 'M',
    condition: Condition.NEW,
    estimatedSwapValue: 65,
    status: ListingStatus.AVAILABLE,
    images: ['https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80'],
  },

  // ── 3. Kids ──────────────────────────────────────────────────────────────
  {
    title: 'Kids Corduroy Overalls & Striped Tee Set',
    description: 'Adorable unisex kids vintage mustard corduroy overalls with snap buttons and matching tee.',
    category: Category.BOTTOMWEAR,
    brand: 'MINI RODINI',
    color: 'Mustard',
    size: 'S',
    condition: Condition.NEW,
    estimatedSwapValue: 45,
    status: ListingStatus.AVAILABLE,
    images: ['https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=800&q=80'],
  },
  {
    title: 'Kids Puffer Hooded Weatherproof Parka',
    description: 'Warm and durable kids winter puffer jacket with reflective safety accents and fleece lining.',
    category: Category.OUTERWEAR,
    brand: 'PATAGONIA',
    color: 'Navy',
    size: 'M',
    condition: Condition.LIKE_NEW,
    estimatedSwapValue: 68,
    status: ListingStatus.AVAILABLE,
    images: ['https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=800&q=80'],
  },

  // ── 4. Home ──────────────────────────────────────────────────────────────
  {
    title: 'Home Artisanal Handwoven Fringe Throw Blanket',
    description: 'Cozy home decor handwoven textured throw blanket in neutral cream and earthy tones.',
    category: Category.ACCESSORIES,
    brand: 'WEST ELM',
    color: 'Cream',
    size: 'One Size',
    condition: Condition.NEW,
    estimatedSwapValue: 62,
    status: ListingStatus.AVAILABLE,
    images: ['https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80'],
  },
  {
    title: 'Home Minimalist Ceramic Vase & Dried Floral Decor',
    description: 'Modern organic ceramic vase for aesthetic home living room and bedroom styling.',
    category: Category.ACCESSORIES,
    brand: 'CB2',
    color: 'Terracotta',
    size: 'One Size',
    condition: Condition.LIKE_NEW,
    estimatedSwapValue: 48,
    status: ListingStatus.AVAILABLE,
    images: ['https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=800&q=80'],
  },

  // ── 5. Pets ──────────────────────────────────────────────────────────────
  {
    title: 'Pets Chunky Cable-Knit Wool Dog Sweater',
    description: 'Cozy autumn pets dog sweater with ribbed collar and comfortable leg openings.',
    category: Category.ACCESSORIES,
    brand: 'BARK & CO',
    color: 'Heather Grey',
    size: 'M',
    condition: Condition.NEW,
    estimatedSwapValue: 34,
    status: ListingStatus.AVAILABLE,
    images: ['https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80'],
  },
  {
    title: 'Pets High-Visibility Waterproof Dog Raincoat',
    description: 'Yellow waterproof pets jacket with reflective striping and breathable mesh inner lining.',
    category: Category.ACCESSORIES,
    brand: 'RUFFWEAR',
    color: 'Yellow',
    size: 'L',
    condition: Condition.LIKE_NEW,
    estimatedSwapValue: 42,
    status: ListingStatus.AVAILABLE,
    images: ['https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?auto=format&fit=crop&w=800&q=80'],
  },

  // ── 6. Electronics ───────────────────────────────────────────────────────
  {
    title: 'Electronics Heritage Italian Leather Smartwatch Strap',
    description: 'Handcrafted top-grain leather electronics band compatible with Apple Watch 40mm/44mm/Ultra.',
    category: Category.ACCESSORIES,
    brand: 'NOMAD',
    color: 'Cognac',
    size: 'One Size',
    condition: Condition.LIKE_NEW,
    estimatedSwapValue: 65,
    status: ListingStatus.AVAILABLE,
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'],
  },
  {
    title: 'Electronics Wireless Over-Ear Active Noise-Cancelling Headphones',
    description: 'Matte black premium electronics headphones with travel hard case and high-fidelity sound.',
    category: Category.ACCESSORIES,
    brand: 'SONY',
    color: 'Black',
    size: 'One Size',
    condition: Condition.LIKE_NEW,
    estimatedSwapValue: 195,
    status: ListingStatus.AVAILABLE,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'],
  },

  // ── 7. Luxury ────────────────────────────────────────────────────────────
  {
    title: 'Luxury Quilted Lambskin Flap Shoulder Bag',
    description: 'Timeless luxury double flap bag in black lambskin leather with 24k gold-plated CC turnlock.',
    category: Category.ACCESSORIES,
    brand: 'CHANEL',
    color: 'Black',
    size: 'One Size',
    condition: Condition.LIKE_NEW,
    estimatedSwapValue: 850,
    status: ListingStatus.AVAILABLE,
    images: ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80'],
  },
  {
    title: 'Luxury Silk Jacquard Monogram Heritage Scarf',
    description: 'Iconic luxury Italian silk square scarf with hand-rolled borders in rich burgundy and cream.',
    category: Category.ACCESSORIES,
    brand: 'GUCCI',
    color: 'Burgundy',
    size: 'One Size',
    condition: Condition.NEW,
    estimatedSwapValue: 320,
    status: ListingStatus.AVAILABLE,
    images: ['https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=800&q=80'],
  },

  // ── 8. Beauty ────────────────────────────────────────────────────────────
  {
    title: 'Beauty Quilted Velvet Cosmetics Vanity Case',
    description: 'Elegant beauty organizer in rose velvet with gold zipper and water-resistant interior lining.',
    category: Category.ACCESSORIES,
    brand: 'DIOR',
    color: 'Rose',
    size: 'One Size',
    condition: Condition.NEW,
    estimatedSwapValue: 68,
    status: ListingStatus.AVAILABLE,
    images: ['https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80'],
  },
  {
    title: 'Beauty English Pear & Freesia Cologne Set',
    description: 'Sensuous beauty fragrance with notes of just-ripe pears and white freesias, with velvet pouch.',
    category: Category.ACCESSORIES,
    brand: 'JO MALONE',
    color: 'Amber',
    size: 'One Size',
    condition: Condition.NEW,
    estimatedSwapValue: 92,
    status: ListingStatus.AVAILABLE,
    images: ['https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80'],
  },

  // ── 9. Plus (Size XL) ─────────────────────────────────────────────────────
  {
    title: 'Plus Size Emerald Velvet Wrap Cocktail Dress',
    description: 'Flattering plus size deep green velvet wrap dress with tulip hem and waist-cinching tie.',
    category: Category.DRESS,
    brand: 'TORRID',
    color: 'Emerald',
    size: 'XL',
    condition: Condition.NEW,
    estimatedSwapValue: 75,
    status: ListingStatus.AVAILABLE,
    images: ['https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80'],
  },
  {
    title: 'Plus Size High-Waisted Stretch Wide Leg Trousers',
    description: 'Ultra-comfortable plus size pleated trousers in dark espresso with elasticized back waist.',
    category: Category.BOTTOMWEAR,
    brand: 'UNIVERSAL STANDARD',
    color: 'Espresso',
    size: 'XL',
    condition: Condition.LIKE_NEW,
    estimatedSwapValue: 62,
    status: ListingStatus.AVAILABLE,
    images: ['https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80'],
  },

  // ── 10. Petite (Size XS) ──────────────────────────────────────────────────
  {
    title: 'Petite Tailored Houndstooth Structured Blazer',
    description: 'Proportion-perfect petite double-breasted wool blazer with notched lapels and horn buttons.',
    category: Category.OUTERWEAR,
    brand: 'J.CREW PETITE',
    color: 'Black/White',
    size: 'XS',
    condition: Condition.LIKE_NEW,
    estimatedSwapValue: 89,
    status: ListingStatus.AVAILABLE,
    images: ['https://images.unsplash.com/photo-1554412933-514a83d2f3c8?auto=format&fit=crop&w=800&q=80'],
  },
  {
    title: 'Petite Bias-Cut Pleated Satin Slip Skirt',
    description: 'Chic petite midi slip skirt in champagne satin with comfortable hidden elastic waistband.',
    category: Category.BOTTOMWEAR,
    brand: 'ANTHROPOLOGIE',
    color: 'Champagne',
    size: 'XS',
    condition: Condition.NEW,
    estimatedSwapValue: 58,
    status: ListingStatus.AVAILABLE,
    images: ['https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=800&q=80'],
  },

  // ── 11. Trending ─────────────────────────────────────────────────────────
  {
    title: 'Trending Streetwear Washed Heavyweight Boxy Hoodie',
    description: 'Trending oversized 450gsm loopback cotton hoodie with dropped shoulders and distressed vintage wash.',
    category: Category.TOPWEAR,
    brand: 'FEAR OF GOD',
    color: 'Vintage Black',
    size: 'L',
    condition: Condition.LIKE_NEW,
    estimatedSwapValue: 110,
    status: ListingStatus.AVAILABLE,
    images: ['https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80'],
  },
  {
    title: 'Trending Retro Chunky Platform Lug-Sole Loafers',
    description: 'Trending polished calfskin loafers with exaggerated lug sole and brushed silver buckle.',
    category: Category.FOOTWEAR,
    brand: 'PRADA',
    color: 'Black',
    size: '38',
    condition: Condition.LIKE_NEW,
    estimatedSwapValue: 240,
    status: ListingStatus.AVAILABLE,
    images: ['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80'],
  },

  // ── 12. Brand ────────────────────────────────────────────────────────────
  {
    title: 'Brand Vintage 501 Original Selvedge Jeans',
    description: 'Iconic brand high-waisted wash straight leg denim with classic button fly and red-line selvedge.',
    category: Category.BOTTOMWEAR,
    brand: "LEVI'S",
    color: 'Medium Blue',
    size: '32',
    condition: Condition.GOOD,
    estimatedSwapValue: 52,
    status: ListingStatus.AVAILABLE,
    images: ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80'],
  },
  {
    title: 'Brand Double-Breasted Wool Blend Camel Trench Coat',
    description: 'Double-breasted trench in camel wool blend. Relaxed modern tailoring from flagship brand.',
    category: Category.OUTERWEAR,
    brand: 'ARITZIA',
    color: 'Camel',
    size: 'M',
    condition: Condition.NEW,
    estimatedSwapValue: 120,
    status: ListingStatus.AVAILABLE,
    images: ['https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80'],
  },
];

async function main() {
  console.log('Seeding SwapWear database with all category items...');

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
      console.log(`+ Seeded: ${item.title}`);
    } else {
      console.log(`- Existing: ${item.title}`);
    }
  }

  console.log('Database seeded successfully with all categories!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
