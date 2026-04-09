import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Inter, Geist } from 'next/font/google';
import { QueryProvider } from '@/providers/query-provider';
import './globals.css';
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Online Assessment Platform',
  description: 'A comprehensive online assessment platform for employers and candidates',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={`${inter.variable} ${inter.className}`}>
        <ClerkProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}