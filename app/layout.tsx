import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import FloatingAIChat from "@/components/FloatingAIChat";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bourse",
  description: "Track real-time stock prices, get personalized alerts and explore detailed company insights.",
  icons: {
    icon: "/assets/icons/bourse-icon.svg",
    shortcut: "/assets/icons/bourse-icon.svg",
    apple: "/assets/icons/bourse-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <FloatingAIChat />
        <Toaster />
      </body>
    </html>
  );
}
