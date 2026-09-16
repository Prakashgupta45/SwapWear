import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding SwapWear database...');

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
    },
  });

  console.log('Database seeded successfully:');
  console.log({
    admin: { id: admin.id, email: admin.email, role: admin.role },
    user: { id: user.id, email: user.email, role: user.role },
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
