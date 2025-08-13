import { PrismaClient } from './generated/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // Create a sample company
  const company = await prisma.company.create({
    data: {
      name: 'InkGest Demo Studio',
      settings: JSON.stringify({
        currency: 'EUR',
        timezone: 'Europe/Madrid',
        language: 'es',
      }),
      subscription: 'premium',
    },
  });

  // Create a sample store
  const store = await prisma.store.create({
    data: {
      companyId: company.id,
      name: 'Tienda Principal',
      configuration: JSON.stringify({
        theme: 'light',
        notifications: true,
      }),
      timezone: 'Europe/Madrid',
      businessHours: JSON.stringify({
        monday: { open: '09:00', close: '18:00', closed: false },
        tuesday: { open: '09:00', close: '18:00', closed: false },
        wednesday: { open: '09:00', close: '18:00', closed: false },
        thursday: { open: '09:00', close: '18:00', closed: false },
        friday: { open: '09:00', close: '18:00', closed: false },
        saturday: { open: '10:00', close: '16:00', closed: false },
        sunday: { open: '00:00', close: '00:00', closed: true },
      }),
    },
  });

  // Create sample users
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@inkgest.com',
      name: 'Administrador',
      role: 'ADMIN',
      companyId: company.id,
      storeIds: JSON.stringify([store.id]),
      preferences: JSON.stringify({
        theme: 'light',
        language: 'es',
      }),
    },
  });

  const artistUser = await prisma.user.create({
    data: {
      email: 'artist@inkgest.com',
      name: 'Artista Principal',
      role: 'ARTIST',
      companyId: company.id,
      storeIds: JSON.stringify([store.id]),
      preferences: JSON.stringify({
        theme: 'dark',
        language: 'es',
      }),
    },
  });

  // Create sample artist
  await prisma.artist.create({
    data: {
      storeId: store.id,
      userId: artistUser.id,
      specialties: JSON.stringify(['TATTOO', 'PIERCING']),
      schedule: JSON.stringify({
        monday: { start: '09:00', end: '17:00', available: true },
        tuesday: { start: '09:00', end: '17:00', available: true },
        wednesday: { start: '09:00', end: '17:00', available: true },
        thursday: { start: '09:00', end: '17:00', available: true },
        friday: { start: '09:00', end: '17:00', available: true },
        saturday: { start: '10:00', end: '15:00', available: true },
        sunday: { start: '00:00', end: '00:00', available: false },
      }),
      commission: 0.6,
    },
  });

  // Create sample services
  await prisma.service.create({
    data: {
      storeId: store.id,
      name: 'Tatuaje Pequeño',
      description: 'Tatuaje de hasta 5cm',
      duration: 120,
      price: 80.0,
      category: 'TATTOO',
      requiresConsent: true,
    },
  });

  await prisma.service.create({
    data: {
      storeId: store.id,
      name: 'Piercing Oreja',
      description: 'Piercing en lóbulo o cartílago',
      duration: 30,
      price: 25.0,
      category: 'PIERCING',
      requiresConsent: true,
    },
  });

  // Create sample room
  await prisma.room.create({
    data: {
      storeId: store.id,
      name: 'Cabina 1',
      description: 'Cabina principal para tatuajes',
      isAvailable: true,
    },
  });

  // Create sample client
  await prisma.client.create({
    data: {
      storeId: store.id,
      email: 'cliente@example.com',
      name: 'Cliente Demo',
      phone: '+34600123456',
      birthDate: new Date('1990-05-15'),
      isMinor: false,
      imageRights: true,
      source: 'Instagram',
      loyaltyPoints: 50,
    },
  });

  // Create sample products
  await prisma.product.createMany({
    data: [
      {
        storeId: store.id,
        name: 'Crema Cicatrizante',
        description: 'Crema para el cuidado post-tatuaje',
        price: 15.0,
        stock: 25,
        minStock: 5,
        batch: 'BATCH001',
        expiryDate: new Date('2025-12-31'),
      },
      {
        storeId: store.id,
        name: 'Jabón Antibacterial',
        description: 'Jabón especial para limpieza de tatuajes',
        price: 8.0,
        stock: 40,
        minStock: 10,
        batch: 'BATCH002',
        expiryDate: new Date('2025-06-30'),
      },
    ],
  });

  console.log('✅ Seed data created successfully');
  console.log(`Company: ${company.name} (${company.id})`);
  console.log(`Store: ${store.name} (${store.id})`);
  console.log(`Admin User: ${adminUser.email}`);
  console.log(`Artist: ${artistUser.email}`);
}

main()
  .catch(e => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });