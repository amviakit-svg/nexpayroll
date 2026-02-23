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

  for (const row of employees) {
    try {
      const name = row['Full Name*'];
      const email = row['Email Address*'];
      const password = row['Initial Password*'] || 'password123';
      const role = row['System Role'] === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE';
      const managerEmail = row['Reporting Manager Email'];

      if (!email || !name) {
        errors.push({ email: email || 'unknown', error: 'Missing name or email' });
        continue;
      }

      const hash = await bcrypt.hash(password, 10);

      // Manager Lookup by Email
      let managerId = null;
      if (managerEmail) {
        const manager = await prisma.user.findFirst({
          where: { email: { equals: managerEmail, mode: 'insensitive' } }
        });
        if (manager) managerId = manager.id;
      }

      // Find existing user (case-insensitive) to get correct ID for upsert/update
      const existingUser = await prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } }
      });

      await prisma.user.upsert({
        where: { email: existingUser?.email || email },
        update: {
          name,
          role,
          managerId,
          pan: String(row['PAN Card'] || '') || null,
          designation: String(row['Designation'] || '') || null,
          pfNumber: String(row['PF Number'] || '') || null,
          employeeCode: String(row['Employee Code'] || '') || null,
          bankName: String(row['Bank Name'] || '') || null,
          accountNumber: String(row['Account No'] || '') || null,
          ifscCode: String(row['IFSC Code'] || '') || null,
          department: String(row['Client / Dept'] || '') || null,
          dateOfJoining: row['Join Date'] ? new Date(row['Join Date']) : null,
        },
        create: {
          email,
          name,
          passwordHash: hash,
          role,
          managerId,
          pan: String(row['PAN Card'] || '') || null,
          designation: String(row['Designation'] || '') || null,
          pfNumber: String(row['PF Number'] || '') || null,
          employeeCode: String(row['Employee Code'] || '') || null,
          bankName: String(row['Bank Name'] || '') || null,
          accountNumber: String(row['Account No'] || '') || null,
          ifscCode: String(row['IFSC Code'] || '') || null,
          department: String(row['Client / Dept'] || '') || null,
          dateOfJoining: row['Join Date'] ? new Date(row['Join Date']) : null,
        }
      });
      results.push({ email, status: 'success' });
    } catch (e) {
      console.error(e);
      errors.push({ email: row['Email Address*'] || 'unknown', error: (e as Error).message });
    }
  }

  return NextResponse.json({ results, errors });
}
