import type { Metadata } from "next";
import { Geist, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Invoicely",
  description: "Invoice management for your business",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${jakarta.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full bg-background">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
