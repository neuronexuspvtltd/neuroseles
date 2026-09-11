const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial system users...');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@neurosales.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const adminName = process.env.ADMIN_NAME || 'System Administrator';

  const managerEmail = process.env.MANAGER_EMAIL || 'manager@neurosales.com';
  const managerPassword = process.env.MANAGER_PASSWORD || 'Manager@123456';
  const managerName = process.env.MANAGER_NAME || 'Sales Manager';

  const salesEmail = process.env.SALES_EMAIL || 'sales@neurosales.com';
  const salesPassword = process.env.SALES_PASSWORD || 'Sales@123456';
  const salesName = process.env.SALES_NAME || 'Sales Executive';

  // Seed Admin
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        passwordHash: adminPasswordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
    console.log(`Created Admin user: ${adminEmail}`);
  } else {
    console.log(`Admin user already exists: ${adminEmail}`);
  }

  // Seed Manager
  const existingManager = await prisma.user.findUnique({
    where: { email: managerEmail },
  });

  if (!existingManager) {
    const managerPasswordHash = await bcrypt.hash(managerPassword, 10);
    await prisma.user.create({
      data: {
        name: managerName,
        email: managerEmail,
        passwordHash: managerPasswordHash,
        role: 'MANAGER',
        status: 'ACTIVE',
      },
    });
    console.log(`Created Manager user: ${managerEmail}`);
  } else {
    console.log(`Manager user already exists: ${managerEmail}`);
  }

  // Seed Sales Staff
  const existingSales = await prisma.user.findUnique({
    where: { email: salesEmail },
  });

  if (!existingSales) {
    const salesPasswordHash = await bcrypt.hash(salesPassword, 10);
    await prisma.user.create({
      data: {
        name: salesName,
        email: salesEmail,
        passwordHash: salesPasswordHash,
        role: 'SALES_STAFF',
        status: 'ACTIVE',
      },
    });
    console.log(`Created Sales Staff user: ${salesEmail}`);
  } else {
    console.log(`Sales Staff user already exists: ${salesEmail}`);
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
