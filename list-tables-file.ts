import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    try {
        const tables: any[] = await prisma.$queryRawUnsafe(`
      SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'
    `);
        const names = tables.map(t => t.tablename);
        fs.writeFileSync('tables.txt', names.join('\n'));
        console.log('Tables written to tables.txt');
    } catch (err: any) {
        fs.writeFileSync('tables.txt', 'Error: ' + err.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
