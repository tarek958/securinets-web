import { Inter } from 'next/font/google';
import { AuthProvider } from '@/components/Providers';
import { ThemeProvider } from '@/components/ThemeProvider';
import Navbar from '@/components/Navbar';
import { Toaster } from 'react-hot-toast';
import ChallengeNotification from '@/components/ChallengeNotification';
import "./globals.css";
import { headers } from 'next/headers';

const inter = Inter({ subsets: ['latin'] });

async function getSettings() {
  try {
    const headersList = await headers();
    const domain = headersList.get('host') || 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    
    const response = await fetch(`${protocol}://${domain}/api/admin/settings`, {
      cache: 'no-store'
    });
    
    if (response.ok) {
      return response.json();
    }
    return {};
  } catch (error) {
    console.error('Error fetching settings:', error);
    return {};
  }
}

export async function generateMetadata() {
  const settings = await getSettings();
  return {
    title: settings.ctfName || 'Securinets CTF Platform',
    description: 'A modern CTF platform for cybersecurity competitions',
    icons: {
      icon: [
        {
          url: settings.faviconUrl || '/favicon.ico',
          sizes: 'any',
          type: 'image/x-icon',
        },
      ],
      shortcut: settings.faviconUrl || '/favicon.ico',
      apple: settings.faviconUrl || '/favicon.ico',
    },
  };
}

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
              <div className="z-[100]">
                <Navbar />
              </div>
              <div className="flex-grow">
                <div className="pt-20">
                  {children}
                </div>
              </div>
              <ChallengeNotification />
              <Toaster position="top-right" />
            </div>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
