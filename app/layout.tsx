import './globals.css';
import { Inter, Poppins } from "next/font/google";
import Providers from '@/components/Providers';
import { APP_NAME } from '@/lib/brand';
import AutoToast from '@/components/AutoToast';

import { prisma } from '@/lib/prisma';

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} font-sans`}>
        <Providers>
          <AutoToast />
          {children}
        </Providers>
      </body>
    </html>
  );
}
