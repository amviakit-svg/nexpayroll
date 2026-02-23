import { prisma } from './prisma';
import { computePayroll } from './payroll';
import { generatePayslipPdf } from './pdf';

type VariableByEmployee = Record<string, Record<string, number>>;

export async function buildPayrollPreview(
  year: number,
  month: number,
  leavesByEmployee: Record<string, number>,
  variableByEmployee: VariableByEmployee
) {
  const existing = await prisma.payrollCycle.findUnique({ where: { year_month: { year, month } } });
  if (existing?.status === 'SUBMITTED') throw new Error('Payroll already submitted and locked for this month');

  const employees = await prisma.user.findMany({ where: { role: 'EMPLOYEE', isActive: true }, orderBy: { name: 'asc' } });
  const variableComponents = await prisma.salaryComponent.findMany({ where: { isActive: true, isVariable: true }, orderBy: { sortOrder: 'asc' } });

  const rows = await Promise.all(
    employees.map(async (employee) => {
      const fixedValues = await prisma.employeeComponentValue.findMany({
        where: { employeeId: employee.id, isActive: true, component: { isActive: true, isVariable: false } },
        include: { component: true },
        orderBy: { component: { sortOrder: 'asc' } }
      });

      const variableValues = variableComponents.map((component) => ({
        componentId: component.id,
        amount: Math.max(0, Number(variableByEmployee?.[employee.id]?.[component.id] ?? 0)),
        component
      }));

      const leaves = Math.max(0, Number(leavesByEmployee[employee.id] ?? 0));
      const calc = computePayroll(
        [
          ...fixedValues.map((v) => ({ type: v.component.type, amount: v.amount, isVariableAdjustment: false })),
          ...variableValues.map((v) => ({ type: v.component.type, amount: v.amount, isVariableAdjustment: true }))
        ],
        leaves
      );

      return {
        employee,
        fixedValues,
        variableValues,
        leaves,
        ...calc
      };
    })
  );

  return { year, month, variableComponents, rows };
}

export async function submitPayroll(
  year: number,
  month: number,
  leavesByEmployee: Record<string, number>,
  variableByEmployee: VariableByEmployee,
  createdById: string
) {
  const existing = await prisma.payrollCycle.findUnique({ where: { year_month: { year, month } } });
  if (existing?.status === 'SUBMITTED') throw new Error('Payroll already submitted and locked for this month');

  const preview = await buildPayrollPreview(year, month, leavesByEmployee, variableByEmployee);

  const cycle =
    existing ??
    (await prisma.payrollCycle.create({
      data: { year, month, createdById }
    }));

  if (cycle.status === 'SUBMITTED') throw new Error('Cycle locked');

  for (const row of preview.rows) {
    const entry = await prisma.payrollEntry.upsert({
      where: { payrollCycleId_employeeId: { payrollCycleId: cycle.id, employeeId: row.employee.id } },
      update: {
        leaves: row.leaves,
        workingDays: row.workingDays,
        grossEarnings: row.grossEarnings,
        totalDeductions: row.totalDeductions,
        netMonthlySalary: row.netMonthlySalary,
        finalPayable: row.finalPayable
      },
      create: {
        payrollCycleId: cycle.id,
        employeeId: row.employee.id,
        leaves: row.leaves,
        workingDays: row.workingDays,
        grossEarnings: row.grossEarnings,
        totalDeductions: row.totalDeductions,
        netMonthlySalary: row.netMonthlySalary,
        finalPayable: row.finalPayable
      }
    });

    await prisma.payrollLineItem.deleteMany({ where: { payrollEntryId: entry.id } });

    const fixedItems = row.fixedValues.map((v) => ({
      payrollEntryId: entry.id,
      componentId: v.componentId,
      componentNameSnapshot: v.component.name,
      componentTypeSnapshot: v.component.type,
      amount: v.amount,
      isVariableAdjustment: false
    }));

    const variableItems = row.variableValues.map((v) => ({
      payrollEntryId: entry.id,
      componentId: v.componentId,
      componentNameSnapshot: v.component.name,
      componentTypeSnapshot: v.component.type,
      amount: v.amount,
      isVariableAdjustment: true
    }));

    const items = [...fixedItems, ...variableItems];

    if (items.length) {
      await prisma.payrollLineItem.createMany({ data: items });
    }

    await generatePayslipForEntry(entry.id);
  }

  await prisma.payrollCycle.update({
    where: { id: cycle.id },
    data: { status: 'SUBMITTED', submittedAt: new Date() }
  });

  return cycle;
}

export async function generatePayslipForEntry(entryId: string) {
  const entry = await prisma.payrollEntry.findUnique({
    where: { id: entryId },
    include: {
      employee: true,
      payrollCycle: true,
      lineItems: {
        include: {
          component: true
        },
        orderBy: {
          component: {
            sortOrder: 'asc'
          }
        }
      }
    }
  });

  if (!entry) throw new Error('Entry not found');

  const config = await prisma.tenantConfig.findFirst();
  const declarations = await prisma.taxDeclaration.findMany({
    where: { userId: entry.employeeId, year: entry.payrollCycle.year }
  });

  const { join } = await import('path');
  const relativePath = join('public', 'payslips', `${entry.payrollCycle.year}-${entry.payrollCycle.month}-${entry.employeeId}.pdf`);
  const absolutePath = join(process.cwd(), relativePath);

  const fixedEarnings = entry.lineItems.filter(i => i.componentTypeSnapshot === 'EARNING' && !i.isVariableAdjustment).reduce((acc, i) => acc + Number(i.amount), 0);
  const variableEarnings = entry.lineItems.filter(i => i.componentTypeSnapshot === 'EARNING' && i.isVariableAdjustment).reduce((acc, i) => acc + Number(i.amount), 0);
  const fixedDeductions = entry.lineItems.filter(i => i.componentTypeSnapshot === 'DEDUCTION' && !i.isVariableAdjustment).reduce((acc, i) => acc + Number(i.amount), 0);
  const variableDeductions = entry.lineItems.filter(i => i.componentTypeSnapshot === 'DEDUCTION' && i.isVariableAdjustment).reduce((acc, i) => acc + Number(i.amount), 0);

  await generatePayslipPdf(absolutePath, {
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

    month: entry.payrollCycle.month,
    year: entry.payrollCycle.year,
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

    annualGross: Number(entry.grossEarnings) * 12,
    standardDeduction: 75000,
    total80C: declarations.filter(d => d.category === '80C').reduce((acc, d) => acc + Number(d.amount || 0), 0),
    total80D: declarations.filter(d => d.category === '80D').reduce((acc, d) => acc + Number(d.amount || 0), 0),
    taxableIncome: 0, // Deprecated in favor of dynamic rows
    taxPayable: 0,

    // --- Dynamic Tax Projection ---
    taxProjection: await (async () => {
      const rows = await prisma.taxProjectionRow.findMany({ orderBy: { order: 'asc' } });
      const context: Record<string, number> = {
        'Annual Gross Salary': Number(entry.grossEarnings) * 12,
        'Standard Deduction': 75000,
        'Professional Tax': (fixedDeductions * 12),
        'Total 80C': declarations.filter(d => d.category === '80C').reduce((acc, d) => acc + Number(d.amount || 0), 0),
        'Total 80D': declarations.filter(d => d.category === '80D').reduce((acc, d) => acc + Number(d.amount || 0), 0),
        'HRA Exemption': declarations.filter(d => d.category === 'HRA').reduce((acc, d) => acc + Number(d.amount || 0), 0),
      };

      return rows.map(r => {
        let value = 0;
        try {
          // Replace {Label} with context values
          let expr = r.formula;
          for (const [key, val] of Object.entries(context)) {
            expr = expr.replace(new RegExp(`{${key}}`, 'g'), String(val));
          }
          // Allow referencing previously calculated rows by label
          // (Simple single-pass, relies on order)
          for (const [key, val] of Object.entries(context)) {
            expr = expr.replace(new RegExp(`{${key}}`, 'g'), String(val));
          }

          // Safe eval (numbers and operators only)
          // Removing anything that isn't a digit, operator, dot, or parenthesis
          const sanitized = expr.replace(/[^0-9+\-*/(). ]/g, '');
          value = new Function(`return ${sanitized}`)();

          // Add to context for subsequent rows
          context[r.label] = value;
        } catch (e) {
          console.error(`Error evaluating formula for ${r.label}:`, e);
          value = 0;
        }
        return { label: r.label, value };
      });
    })(),

    items: entry.lineItems.map(i => ({
      name: i.componentNameSnapshot,
      type: i.componentTypeSnapshot,
      amount: Number(i.amount),
      isVariableAdjustment: i.isVariableAdjustment
    }))
  });

  return prisma.payrollEntry.update({
    where: { id: entryId },
    data: { payslipPath: relativePath },
    include: { employee: true }
  });
}

export async function reopenPayroll(year: number, month: number) {
  const existing = await prisma.payrollCycle.findUnique({ where: { year_month: { year, month } } });
  if (!existing) throw new Error('Payroll cycle not found');
  if (existing.status !== 'SUBMITTED') throw new Error('Payroll cycle is not submitted');

  return prisma.payrollCycle.update({
    where: { id: existing.id },
    data: { status: 'DRAFT' }
  });
}
