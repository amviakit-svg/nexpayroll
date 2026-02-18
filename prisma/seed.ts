import { PrismaClient, ComponentType, Role, LeaveStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@local.test';
  const adminPassword = 'Admin@123';
  const adminHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: adminHash, role: Role.ADMIN, isActive: true, name: 'System Admin' },
    create: {
      name: 'System Admin',
      email: adminEmail,
      role: Role.ADMIN,
      passwordHash: adminHash,
      isActive: true
    }
  });

  await prisma.salaryComponent.upsert({
    where: { name_type: { name: 'Basic Pay', type: ComponentType.EARNING } },
    update: { isVariable: false, isActive: true },
    create: { name: 'Basic Pay', type: ComponentType.EARNING, isVariable: false }
  });

  await prisma.salaryComponent.upsert({
    where: { name_type: { name: 'Professional Tax', type: ComponentType.DEDUCTION } },
    update: { isVariable: false, isActive: true },
    create: { name: 'Professional Tax', type: ComponentType.DEDUCTION, isVariable: false }
  });

  // Seed Leave Types
  const leaveTypes = [
    { name: 'Planned', color: '#10B981', description: 'Planned/paid leave with monthly 2-day credit' },
    { name: 'Sick', color: '#EF4444', description: 'Sick leave - no balance limit' },
    { name: 'Casual', color: '#F59E0B', description: 'Casual leave - no balance limit' }
  ];

  for (const lt of leaveTypes) {
    await prisma.leaveType.upsert({
      where: { name: lt.name },
      update: { color: lt.color, description: lt.description, isActive: true },
      create: lt
    });
  }

  console.log('Seed complete');
  console.log(`Admin login -> email: ${adminEmail} password: ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
