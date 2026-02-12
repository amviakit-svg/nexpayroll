import { resetMonthlyBalances } from '../lib/leaveService';

async function main() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  console.log(`Resetting monthly balances for ${year}-${month}...`);

  try {
    const count = await resetMonthlyBalances(year, month);
    console.log(`Successfully reset balances for ${count} employees`);
    process.exit(0);
  } catch (e: any) {
    console.error('Error resetting balances:', e.message);
    process.exit(1);
  }
}

main();
