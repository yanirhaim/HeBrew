import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"], // Duolingo uses bold weights often
});

export const metadata: Metadata = {
  title: "HeBrew - Aprende Hebreo",
  description: "Aprende hebreo con herramientas de conjugación, traducción y práctica",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${nunito.variable} antialiased`}
      >
        <div className="min-h-screen bg-white">
          {children}
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
