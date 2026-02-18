import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import EmployeeDirectory from './EmployeeDirectory';
import { createEmployee, toggleActive, resetPassword, editEmployee } from './actions';

export default async function EmployeesPage() {
  await requireAdmin();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: { manager: true }
  });

  const potentialManagers = users.filter(u => u.isActive);
  const sections = await prisma.formSection.findMany({ orderBy: { order: 'asc' } });

  return (
    <EmployeeDirectory
      initialUsers={JSON.parse(JSON.stringify(users))}
      potentialManagers={JSON.parse(JSON.stringify(potentialManagers))}
      editAction={editEmployee}
      toggleAction={toggleActive}
      resetPasswordAction={resetPassword}
      createAction={createEmployee}
      formSections={JSON.parse(JSON.stringify(sections))}
    />
  );
}
