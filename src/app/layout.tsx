import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'IR Vault | Automated Cloud Backups for IR POS',
  description: 'Enterprise hourly cloud backup and disaster recovery vault for IR POS retail systems.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased">{children}</body>
    </html>
  );
}
