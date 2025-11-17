import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: 'Continuum Scheduler OS',
  description: 'Persona-driven ABA scheduling control tower built with Next.js 14',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-950">
        {children}
      </body>
    </html>
  );
}
