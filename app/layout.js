import { Inter } from 'next/font/google';
import './globals.css';
import ThemeProvider from '@/components/ThemeProvider';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'AXE Copy Studio',
  description: 'AX Enablement — on-brand LG copy for promotional and retail assets',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-[#f5f5f5] dark:bg-[#0a0a0a] text-[#111111] dark:text-white transition-colors duration-200`}>
        <ThemeProvider>
          <div className="pb-16">{children}</div>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
