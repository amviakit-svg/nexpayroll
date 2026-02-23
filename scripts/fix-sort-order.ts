import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Initializing SalaryComponent sortOrder ---');

    const types = ['EARNING', 'DEDUCTION'] as const;

    for (const type of types) {
        const components = await prisma.salaryComponent.findMany({
            where: { type },
            orderBy: { createdAt: 'asc' }
        });

        console.log(`Processing ${type}: ${components.length} items`);

        for (let i = 0; i < components.length; i++) {
            await prisma.salaryComponent.update({
                where: { id: components[i].id },
                data: { sortOrder: i + 1 }
            });
        }
    }

    console.log('--- Done ---');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
