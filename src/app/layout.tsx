import * as React from "react";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Card } from "@/components/ui/card";
import Providers from "@/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OpenNeighborhood",
  description: "Web-based clone of Xbox 360 Neighborhood.",
};

interface LayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} antialiased`}>
        <Providers>
          <div className="flex min-h-screen bg-background p-4">
            <Card className="flex-grow p-4">{children}</Card>
          </div>
        </Providers>
      </body>
    </html>
  );
}
