import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Read as array of arrays to handle the custom header structure
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        let currentEmpCode = '';
        const records = [];

        // Pre-fetch all employees to avoid N+1 queries in the loop
        const allEmployees = await prisma.user.findMany({
            where: { employeeCode: { not: null } },
            select: { id: true, employeeCode: true }
        });
        const employeeMap = new Map(allEmployees.map(e => [e.employeeCode, e.id]));

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;

            // Detect Employee Section
            // Group Row 1: Empcode (Col 0), Value (Col 1)
            if (row[0] === 'Empcode' || row[0] === 'Emp Code') {
                currentEmpCode = String(row[1] || '').trim();
                // Pad with zeros if it's a numeric string (e.g., "2" -> "0002")
                if (currentEmpCode.length < 4 && !isNaN(Number(currentEmpCode))) {
                    currentEmpCode = currentEmpCode.padStart(4, '0');
                }
                continue;
            }

            // Detect Data Row
            // Date format: DD/MM/YYYY (usually at Col 0)
            const dateStr = String(row[0]);
            if (dateStr && /^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
                const employeeId = employeeMap.get(currentEmpCode);
                if (!employeeId) continue;

                // Parse date
                const [day, month, year] = dateStr.split('/').map(Number);
                const dateObj = new Date(year, month - 1, day);

                // Map columns based on snapshot
                // 0:Date, 1:Day, 2:Shift, 3:IN, 4:OUT, 5:Work+OT, 6:OT, 7:Less Hrs, 8:Status, 9:Remark
                records.push({
                    employeeId,
                    date: dateObj,
                    day: String(row[1] || ''),
                    shift: String(row[2] || ''),
                    inTime: String(row[3] || ''),
                    outTime: String(row[4] || ''),
                    workOT: String(row[5] || ''),
                    overtime: String(row[6] || ''),
                    lessHrs: String(row[7] || ''),
                    status: String(row[8] || ''),
                    remark: String(row[9] || ''),
                });
            }
        }

        if (records.length === 0) {
            return NextResponse.json({ error: 'No valid attendance records found in file.' }, { status: 400 });
        }

        // Sequential upsert to ensure database consistency
        for (const record of records) {
            await prisma.attendance.upsert({
                where: {
                    employeeId_date: {
                        employeeId: record.employeeId,
                        date: record.date,
                    }
                },
                update: record,
                create: record,
            });
        }

        const uniqueEmployees = new Set(records.map(r => r.employeeId));

        return NextResponse.json({
            success: true,
            count: uniqueEmployees.size,
            totalRecords: records.length
        });

    } catch (error: any) {
        console.error('Attendance Upload Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
