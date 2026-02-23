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

  // Get all active fixed components for mapping
  const activeComponents = await prisma.salaryComponent.findMany({
    where: { isActive: true, isVariable: false }
  });

  for (const row of assignments) {
    try {
      const email = row['Email Address*'] || row.email; // Fallback to email for compatibility
      if (!email) {
        errors.push({ row, error: 'Missing Email Address*' });
        continue;
      }

      const user = await prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } }
      });
      if (!user) {
        errors.push({ email, error: 'User not found' });
        continue;
      }

      // Process each column that isn't an identifier
      for (const [colName, amount] of Object.entries(row)) {
        const lowerCol = colName.toLowerCase();
        // Skip identification columns
        if (
          lowerCol === 'email address*' ||
          lowerCol === 'email' ||
          lowerCol === 'personnel name' ||
          lowerCol === 'employee code'
        ) continue;

        const component = activeComponents.find(c => c.name.toLowerCase() === colName.toLowerCase());
        if (!component) {
          errors.push({ email, error: `Component not found or not active/fixed: ${colName}` });
          continue;
        }

        const value = parseFloat(String(amount || '0'));
        await prisma.employeeComponentValue.upsert({
          where: { employeeId_componentId: { employeeId: user.id, componentId: component.id } },
          update: { amount: value, isActive: true },
          create: { employeeId: user.id, componentId: component.id, amount: value, isActive: true }
        });
      }

      results.push({ email, status: 'success' });
    } catch (e) {
      console.error(e);
      errors.push({ email: row.email, error: (e as Error).message });
    }
  }

  return NextResponse.json({ results, errors });
}
