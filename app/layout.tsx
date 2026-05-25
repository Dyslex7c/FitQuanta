import type { Metadata } from "next";
import { Orbitron, Inter } from "next/font/google";
import "./globals.css";
import { ReduxProvider } from "@/redux/provider";
import QueryProvider from "@/components/QueryProvider";
import Navbar from "@/components/Navbar";

const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['400', '600', '700', '900'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "FitQuanta — AI Fitness Platform",
  description: "Futuristic AI-powered diet, workout, and analytics platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${orbitron.variable} ${inter.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-text-primary font-body">
        <ReduxProvider>
          <QueryProvider>
            <Navbar />
            <main className="flex-grow flex flex-col">{children}</main>
          </QueryProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
