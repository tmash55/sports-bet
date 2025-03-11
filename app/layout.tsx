"use client";

import { ReactNode } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Viewport } from "next";
import { getSEOTags } from "@/libs/seo";
import Script from "next/script";
import Header from "@/components/Header";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

const font = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <html lang="en" suppressHydrationWarning>
      <head></head>
      <body className={font.className}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <div className="flex flex-col min-h-screen bg-background text-foreground">
              <Header />
              <div className="flex-grow">
                <div className="container mx-auto px-4 py-8">
                  <main>{children}</main>
                </div>
              </div>
              <Footer />
            </div>
            <Toaster />
          </ThemeProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
