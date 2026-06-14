import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bitcoin Tracker',
  description: 'Real-time Bitcoin price tracker with alerts',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-stone-50">
        {children}
      </body>
    </html>
  );
}
