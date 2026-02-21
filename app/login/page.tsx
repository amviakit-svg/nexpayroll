import { APP_NAME } from '@/lib/brand';
import { prisma } from '@/lib/prisma';
import LoginForm from './LoginForm';

export default async function LoginPage() {
  const config = await prisma.setting.findFirst();
  const toolName = config?.toolName || APP_NAME;

  return (
    <div className="mx-auto mt-24 max-w-md px-4">
      <div className="panel">
        <p className="mb-1 text-sm font-medium text-slate-500">Welcome to</p>
        <h1 className="mb-5">{toolName}</h1>
        <LoginForm />
      </div>
    </div>
  );
}
