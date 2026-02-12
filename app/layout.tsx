import './globals.css';
import Providers from '@/components/Providers';
import { APP_NAME } from '@/lib/brand';

export const metadata = {
  title: APP_NAME,
  description: `${APP_NAME} payroll portal`
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
