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
  const workingDays = Math.max(0, 30 - leaves);
  const finalPayable = (netMonthlySalary / 30) * workingDays;

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
