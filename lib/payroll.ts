import { ComponentType, Prisma } from '@prisma/client';

export function toNumber(v: Prisma.Decimal | number | string) {
  return Number(v);
}

type PayrollComponent = {
  type: ComponentType;
  amount: Prisma.Decimal | number;
  isVariableAdjustment?: boolean;
};

export function computePayroll(components: PayrollComponent[], leaves: number) {
  const fixedEarnings = components
    .filter((c) => c.type === ComponentType.EARNING && !c.isVariableAdjustment)
    .reduce((acc, c) => acc + toNumber(c.amount), 0);

  const fixedDeductions = components
    .filter((c) => c.type === ComponentType.DEDUCTION && !c.isVariableAdjustment)
    .reduce((acc, c) => acc + toNumber(c.amount), 0);

  const variableEarnings = components
    .filter((c) => c.type === ComponentType.EARNING && c.isVariableAdjustment)
    .reduce((acc, c) => acc + toNumber(c.amount), 0);

  const variableDeductions = components
    .filter((c) => c.type === ComponentType.DEDUCTION && c.isVariableAdjustment)
    .reduce((acc, c) => acc + toNumber(c.amount), 0);

  const grossEarnings = fixedEarnings + variableEarnings;
  const totalDeductions = fixedDeductions + variableDeductions;
  const netMonthlySalary = grossEarnings - totalDeductions;
  const fixedNet = fixedEarnings - fixedDeductions;

  // Refined Formula: Leave Deduction = ((Fixed Gross - Fixed Deductions) / 30) * Leaves
  // Variable Adjustments (Variable Components) are NOT considered for leave deduction base.
  const leaveDeduction = (fixedNet / 30) * leaves;
  const finalPayable = netMonthlySalary - leaveDeduction;
  const workingDays = Math.max(0, 30 - leaves);

  return {
    fixedEarnings,
    fixedDeductions,
    variableEarnings,
    variableDeductions,
    grossEarnings,
    totalDeductions,
    netMonthlySalary,
    workingDays,
    finalPayable
  };
}
