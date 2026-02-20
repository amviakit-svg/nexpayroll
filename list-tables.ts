import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Table List ---');
    try {
        const tables: any[] = await prisma.$queryRawUnsafe(`
      SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'
    `);
        console.log(tables.map(t => t.tablename));
    } catch (err: any) {
        console.error('Error listing tables:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
