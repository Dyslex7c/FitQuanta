import type { Metadata } from "next";
import { Orbitron, Inter } from "next/font/google";
import "./globals.css";
import { ReduxProvider } from "@/redux/provider";
import QueryProvider from "@/components/QueryProvider";
import Navbar from "@/components/Navbar";

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
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
    <html lang="en" className={`${orbitron.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#0a0a0f] text-[#e2e8f0] font-body">
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
