import * as React from "react";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Card } from "@/components/ui/card";
import Providers from "@/providers";
import "./globals.css";
import Navbar from "@/components/navbar";
import { Toaster } from "@/components/ui/sonner";
import type { LayoutProps } from "@/types/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OpenNeighborhood",
  description: "Web-based clone of Xbox 360 Neighborhood.",
};

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <Providers>
          <div className="flex min-h-screen flex-col gap-4 bg-background p-4">
            <Card className="p-4">
              <Navbar />
            </Card>

            <Card className="flex flex-grow flex-col p-4">{children}</Card>
          </div>

          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
