import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const tormenta = localFont({
  src: "../public/fonts/Tormenta.ttf",
  variable: "--font-tormenta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Catálogo de Itens T20",
  description: "Catálogo client-side de itens de Tormenta 20.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${tormenta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
