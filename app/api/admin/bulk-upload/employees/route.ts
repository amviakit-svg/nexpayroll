import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Papa from 'papaparse';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const text = await file.text();
  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  if (result.errors.length > 0) {
    return NextResponse.json({ error: 'CSV parsing error', details: result.errors }, { status: 400 });
  }

  const employees: any[] = result.data;
  const results = [];
  const errors = [];

  for (const emp of employees) {
    try {
      if (!emp.email || !emp.name) {
        errors.push({ email: emp.email || 'unknown', error: 'Missing name or email' });
        continue;
      }

      const defaultPassword = 'password123';
      const hash = await bcrypt.hash(defaultPassword, 10);
      
      const role = emp.role === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE';

      await prisma.user.upsert({
        where: { email: emp.email },
        update: {
          name: emp.name,
          role,
          pan: emp.pan || null,
          designation: emp.designation || null,
          pfNumber: emp.pfNumber || null,
          employeeCode: emp.employeeCode || null,
          bankName: emp.bankName || null,
          accountNumber: emp.accountNumber || null,
          ifscCode: emp.ifscCode || null,
          dateOfJoining: emp.dateOfJoining ? new Date(emp.dateOfJoining) : null,
          // managerId logic: If manager email provided, look it up? Too complex for now.
        },
        create: {
          email: emp.email,
          name: emp.name,
          passwordHash: hash,
          role,
          pan: emp.pan || null,
          designation: emp.designation || null,
          pfNumber: emp.pfNumber || null,
          employeeCode: emp.employeeCode || null,
          bankName: emp.bankName || null,
          accountNumber: emp.accountNumber || null,
          ifscCode: emp.ifscCode || null,
          dateOfJoining: emp.dateOfJoining ? new Date(emp.dateOfJoining) : null,
        }
      });
      results.push({ email: emp.email, status: 'success' });
    } catch (e) {
        console.error(e);
      errors.push({ email: emp.email, error: (e as Error).message });
    }
  }

  return NextResponse.json({ results, errors });
}
