import './globals.css';
import { Inter, Poppins } from "next/font/google";
import Providers from '@/components/Providers';
import { APP_NAME } from '@/lib/brand';
import AutoToast from '@/components/AutoToast';

const poppins = Poppins({
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
});

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: APP_NAME,
  description: `${APP_NAME} payroll portal`
};

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
