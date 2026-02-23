import './globals.css';
import { Inter, Poppins } from "next/font/google";
import Providers from '@/components/Providers';
import { APP_NAME } from '@/lib/brand';
import AutoToast from '@/components/AutoToast';

import { prisma } from '@/lib/prisma';
import IdleTimer from '@/components/IdleTimer';

const poppins = Poppins({
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
});

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata() {
  let config = null;
  try {
    config = await prisma.tenantConfig.findFirst();
  } catch (error) {
    // Ignore error during static generation if db table does not exist
  }
  const toolName = config?.toolName || APP_NAME;

  return {
    title: {
      default: toolName,
      template: `%s | ${toolName}`
    },
    description: `${toolName} payroll portal`
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let timeout = 5;
  try {
    const config = await prisma.tenantConfig.findFirst();
    if (config?.idleTimeoutMinutes) timeout = config.idleTimeoutMinutes;
  } catch (e) {
    // Default to 5 mins if DB table doesn't exist yet
  }

  return (
    <html lang="en">
      <body className={`${poppins.variable} font-sans`}>
        <Providers>
          <AutoToast />
          <IdleTimer timeoutMinutes={timeout} />
          {children}
        </Providers>
      </body>
    </html>
  );
}
