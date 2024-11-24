import { Inter } from 'next/font/google';
import { AuthProvider } from '@/components/Providers';
import { ThemeProvider } from '@/components/ThemeProvider';
import Navbar from '@/components/Navbar';
import { Toaster } from 'react-hot-toast';
import "./globals.css";

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Securinets CTF Platform',
  description: 'A modern CTF platform for cybersecurity competitions',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css"
          integrity="sha512-z3gLpd7yknf1YoNbCzqRKc4qyor8gaKU1qmn+CShxbuBusANI9QpRohGBreCFkKxLhei6S9CQXFEbbKuqLg0DA=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <ThemeProvider>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <div className="flex-grow">
                {children}
              </div>
            </div>
            <Toaster position="top-right" />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
