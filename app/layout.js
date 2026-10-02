import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import ThemeProvider from '@/components/ThemeProvider';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'HSAD Copy Studio',
  description: 'AX Enablement — on-brand LG copy for promotional and retail assets',
};

// Set the saved theme before first paint so dark mode doesn't flash light.
const themeScript = `try{if(localStorage.getItem('ax-theme')==='dark')document.documentElement.dataset.theme='dark'}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans antialiased min-h-screen flex flex-col">
        <ThemeProvider>
          {children}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
