import { PrismaClient } from '@prisma/client';
import path from 'path';
import { generatePayslipPdf } from '../lib/pdf';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- NexPayroll: Forced PDF Regeneration ---');

        const cycles = await prisma.payrollCycle.findMany({
            where: { status: 'SUBMITTED' }
        });

        if (cycles.length === 0) {
            console.log('[INFO] No submitted payroll cycles found. Nothing to regenerate.');
            return;
        }

        const config = await prisma.tenantConfig.findFirst();

        for (const cycle of cycles) {
            console.log(`\nProcessing Cycle: ${cycle.month}/${cycle.year}`);

            const entries = await prisma.payrollEntry.findMany({
                where: { payrollCycleId: cycle.id },
                include: {
                    employee: true,
                    lineItems: true
                }
            });

            console.log(`Found ${entries.length} entries. Regenerating files...`);

            for (const entry of entries) {
                const declarations = await prisma.taxDeclaration.findMany({
                    where: { userId: entry.employee.id, year: cycle.year }
                });

                // Calculate earnings and deductions from line items
                const fixedEarnings = entry.lineItems.filter(i => i.componentTypeSnapshot === 'EARNING' && !i.isVariableAdjustment).reduce((acc, i) => acc + Number(i.amount), 0);
                const variableEarnings = entry.lineItems.filter(i => i.componentTypeSnapshot === 'EARNING' && i.isVariableAdjustment).reduce((acc, i) => acc + Number(i.amount), 0);
                const fixedDeductions = entry.lineItems.filter(i => i.componentTypeSnapshot === 'DEDUCTION' && !i.isVariableAdjustment).reduce((acc, i) => acc + Number(i.amount), 0);
                const variableDeductions = entry.lineItems.filter(i => i.componentTypeSnapshot === 'DEDUCTION' && i.isVariableAdjustment).reduce((acc, i) => acc + Number(i.amount), 0);

                const filePath = path.join(process.cwd(), 'public', 'payslips', `${cycle.year}-${cycle.month}-${entry.employee.id}.pdf`);

                // Calculate totals for tax projection
                const annualGross = Number(entry.grossEarnings) * 12;
                const standardDeduction = 75000;
                const total80C = declarations.filter(d => d.category === '80C').reduce((acc, d) => acc + Number(d.amount || 0), 0);
                const total80D = declarations.filter(d => d.category === '80D').reduce((acc, d) => acc + Number(d.amount || 0), 0);
                const hraExemption = declarations.filter(d => d.category === 'HRA').reduce((acc, d) => acc + Number(d.amount || 0), 0);
                const taxableIncome = Math.max(0, annualGross - standardDeduction - (fixedDeductions * 12) - total80C - total80D - hraExemption);

                const payslipData = {
                    companyName: config?.companyName,
                    companyAddress: config?.companyAddress || undefined,
                    companyPan: config?.companyPan || undefined,
                    companyLogoUrl: config?.companyLogoUrl || undefined,
                    watermarkEnabled: config?.watermarkEnabled,
                    watermarkText: config?.watermarkText || undefined,

                    employeeName: entry.employee.name,
                    employeeEmail: entry.employee.email,
                    employeeCode: entry.employee.employeeCode || undefined,
                    department: entry.employee.department || undefined,
                    designation: entry.employee.designation || undefined,
                    dateOfJoining: (entry.employee.dateOfJoining instanceof Date && !isNaN(entry.employee.dateOfJoining.getTime()))
                        ? entry.employee.dateOfJoining.toISOString().split('T')[0]
                        : undefined,

                    employeePan: entry.employee.pan || undefined,
                    pfNumber: entry.employee.pfNumber || undefined,
                    // esiNumber: entry.employee.esiNumber || undefined,
                    bankName: entry.employee.bankName || undefined,
                    accountNumber: entry.employee.accountNumber || undefined,

                    month: cycle.month,
                    year: cycle.year,
                    leaves: entry.leaves,
                    workingDays: entry.workingDays,
                    fixedEarnings,
                    variableEarnings,
                    fixedDeductions,
                    variableDeductions,
                    grossEarnings: Number(entry.grossEarnings),
                    totalDeductions: Number(entry.totalDeductions),
                    netMonthlySalary: Number(entry.netMonthlySalary),
                    finalPayable: Number(entry.finalPayable),

                    annualGross,
                    standardDeduction,
                    total80C,
                    total80D,
                    taxableIncome,
                    taxPayable: 0,
                    taxProjection: [], // Added to satisfy potential runtime checks

                    items: entry.lineItems.map(item => ({
                        name: item.componentNameSnapshot,
                        type: item.componentTypeSnapshot,
                        amount: Number(item.amount),
                        isVariableAdjustment: item.isVariableAdjustment
                    }))
                };

                try {
                    await generatePayslipPdf(filePath, payslipData as any);
                    process.stdout.write(`.`); // Progress indicator
                } catch (err) {
                    console.error(`\n[FAIL] Error for ${entry.employee.name}:`, err);
                }
            }
            console.log(`\n[OK] Cycle ${cycle.month}/${cycle.year} regenerated successfully.`);
        }

        console.log('\n--- All Payslips Regenerated ---');
    } catch (e) {
        console.error('CRITICAL ERROR IN SCRIPT:', e);
        process.exit(1);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
