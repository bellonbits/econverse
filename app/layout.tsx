import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "EconoVerse — Learn Economics by Living It",
  description:
    "An immersive economics simulation game where you learn personal finance, entrepreneurship, investing, and macroeconomics by playing inside a living virtual economy.",
  keywords: ["economics", "simulation", "game", "finance", "education", "investing"],
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-[#060B14] text-white min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
