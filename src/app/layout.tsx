import type { Metadata } from "next";
import { Cairo, Montserrat, Playfair_Display, Space_Mono } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-arabic",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "منة ومجدي • ذكرى خطوبتنا",
  description: "موقع توثيق حبنا وذكرى خطوبتنا",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${montserrat.variable} ${playfair.variable} ${spaceMono.variable}`}>
      <body className="font-[family-name:var(--font-arabic)] antialiased">
        {children}
      </body>
    </html>
  );
}