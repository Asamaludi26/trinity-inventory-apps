import { PrismaClient, UserRole } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL ?? '';
  // If using prisma+postgres proxy URL, extract the raw PostgreSQL URL from the API key
  if (url.startsWith('prisma+postgres://')) {
    const apiKey = new URL(
      url.replace('prisma+postgres://', 'http://'),
    ).searchParams.get('api_key');
    if (apiKey) {
      const decoded = JSON.parse(
        Buffer.from(apiKey, 'base64').toString('utf-8'),
      );
      return decoded.databaseUrl;
    }
  }
  return url;
}

const adapter = new PrismaPg({ connectionString: getDatabaseUrl() });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // === Seed Divisions ===
  const divisions = [
    { name: 'Teknisi', code: 'TEK', canDoFieldwork: true },
    { name: 'Logistik', code: 'LOG', canDoFieldwork: false },
    { name: 'Purchasing', code: 'PUR', canDoFieldwork: false },
    { name: 'Management', code: 'MGT', canDoFieldwork: false },
  ];

  for (const div of divisions) {
    await prisma.division.upsert({
      where: { code: div.code },
      update: {},
      create: div,
    });
  }
  console.log('✅ Divisions seeded');

  // === Seed Superadmin User ===
  const hashedPassword = await bcrypt.hash('SuperAdmin@2026', 12);
  const mgtDivision = await prisma.division.findUnique({
    where: { code: 'MGT' },
  });

  await prisma.user.upsert({
    where: { email: 'superadmin@trinity.local' },
    update: {},
    create: {
      employeeId: 'EMP-001',
      fullName: 'Super Admin',
      email: 'superadmin@trinity.local',
      password: hashedPassword,
      role: UserRole.SUPERADMIN,
      divisionId: mgtDivision?.id,
      isActive: true,
    },
  });
  console.log('✅ Superadmin user seeded');

  // === Seed Asset Categories ===
  const categories = ['Device', 'Tools', 'Material Jaringan'];

  for (const name of categories) {
    await prisma.assetCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('✅ Asset categories seeded');

  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
