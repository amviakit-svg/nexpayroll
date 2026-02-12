import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Papa from 'papaparse';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const text = await file.text();
  const result = Papa.parse(text, { header: true, skipEmptyLines: true });

  if (result.errors.length > 0) {
    return NextResponse.json({ error: 'CSV parsing error', details: result.errors }, { status: 400 });
  }
  
  const assignments: any[] = result.data;
  const results = [];
  const errors = [];

  for (const row of assignments) {
    try {
      if (!row.email || !row.component || !row.amount) {
        errors.push({ email: row.email || 'unknown', error: 'Missing email, component or amount' });
        continue;
      }
      
      const user = await prisma.user.findUnique({ where: { email: row.email } });
      if (!user) {
         errors.push({ email: row.email, error: `User not found` });
         continue;
      }

      // Find component by name
      const component = await prisma.salaryComponent.findFirst({ 
        where: { name: { equals: row.component, mode: 'insensitive' } } 
      });

      if (!component) {
        errors.push({ email: row.email, error: `Component not found: ${row.component}` });
        continue;
      }

      await prisma.employeeComponentValue.upsert({
        where: { employeeId_componentId: { employeeId: user.id, componentId: component.id } },
        update: { amount: parseFloat(row.amount), isActive: true },
        create: { employeeId: user.id, componentId: component.id, amount: parseFloat(row.amount) }
      });
      results.push({ email: row.email, component: row.component, status: 'success' });
    } catch (e) {
      console.error(e);
      errors.push({ email: row.email, error: (e as Error).message });
    }
  }

  return NextResponse.json({ results, errors });
}
