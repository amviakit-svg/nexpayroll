import path from 'path';
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
  const variableComponents = await prisma.salaryComponent.findMany({ where: { isActive: true, isVariable: true }, orderBy: { name: 'asc' } });

  const rows = await Promise.all(
    employees.map(async (employee) => {
      const fixedValues = await prisma.employeeComponentValue.findMany({
        where: { employeeId: employee.id, isActive: true, component: { isActive: true, isVariable: false } },
        include: { component: true }
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

    const filePath = path.join(process.cwd(), 'public', 'payslips', `${cycle.year}-${cycle.month}-${row.employee.id}.pdf`);
    await generatePayslipPdf(filePath, {
      employeeName: row.employee.name,
      employeeEmail: row.employee.email,
      month,
      year,
      leaves: row.leaves,
      workingDays: row.workingDays,
      fixedEarnings: row.fixedEarnings,
      variableEarnings: row.variableEarnings,
      fixedDeductions: row.fixedDeductions,
      variableDeductions: row.variableDeductions,
      grossEarnings: row.grossEarnings,
      totalDeductions: row.totalDeductions,
      netMonthlySalary: row.netMonthlySalary,
      finalPayable: row.finalPayable,
      items: items.map((v) => ({
        name: v.componentNameSnapshot,
        type: v.componentTypeSnapshot,
        amount: Number(v.amount),
        isVariableAdjustment: v.isVariableAdjustment
      }))
    });

    await prisma.payrollEntry.update({ where: { id: entry.id }, data: { payslipPath: filePath } });
  }

  await prisma.payrollCycle.update({
    where: { id: cycle.id },
    data: { status: 'SUBMITTED', submittedAt: new Date() }
  });

  return cycle;
}
