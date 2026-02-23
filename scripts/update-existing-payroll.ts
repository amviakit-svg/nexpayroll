import { PrismaClient, ComponentType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting payroll recalculation with new formula: Leave Deduction = (Fixed Gross / 30) * Leaves');

    // Fetch all payroll entries with their line items
    const entries = await prisma.payrollEntry.findMany({
        include: {
            lineItems: true,
            employee: {
                select: {
                    name: true
                }
            }
        }
    });

    console.log(`Found ${entries.length} payroll entries to process.`);

    let updatedCount = 0;

    for (const entry of entries) {
        // 1. Calculate Fixed Gross (fixedEarnings)
        // Fixed Earnings are EARNING type and NOT variable adjustments
        const fixedEarnings = entry.lineItems
            .filter((li) => li.componentTypeSnapshot === ComponentType.EARNING && !li.isVariableAdjustment)
            .reduce((acc, li) => acc + Number(li.amount), 0);

        // 2. Recalculate Leave Deduction
        const leaves = entry.leaves;
        const leaveDeduction = (fixedEarnings / 30) * leaves;

        // 3. Recalculate Final Payable
        // finalPayable = netMonthlySalary - leaveDeduction
        const netMonthlySalary = Number(entry.netMonthlySalary);
        const newFinalPayable = netMonthlySalary - leaveDeduction;

        // 4. Check if update is needed (to avoid redundant database writes)
        // We'll compare with some tolerance for floating point decimals
        if (Math.abs(Number(entry.finalPayable) - newFinalPayable) > 0.01) {
            console.log(`Updating entry for ${entry.employee.name}: Old Payable ₹${Number(entry.finalPayable).toFixed(2)} -> New Payable ₹${newFinalPayable.toFixed(2)} (Fixed Gross: ₹${fixedEarnings.toFixed(2)}, Leaves: ${leaves})`);

            await prisma.payrollEntry.update({
                where: { id: entry.id },
                data: {
                    finalPayable: newFinalPayable
                }
            });
            updatedCount++;
        }
    }

    console.log(`Finished processing. Updated ${updatedCount} entries.`);
}

main()
    .catch((e) => {
        console.error('Error during migration:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
