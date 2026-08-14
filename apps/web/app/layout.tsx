import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Nav from "@/components/Nav";
import AppInsights from "@/components/AppInsights";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Mallory Giesie",
    template: "%s | Mallory Giesie",
  },
  description:
    "AI Solutions Engineer building intelligent systems that connect data, models, and real-world use.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-[#FAFAF9] text-stone-900 min-h-screen">
        <AppInsights />
        <Nav />
        {children}
      </body>
    </html>
  );
}
