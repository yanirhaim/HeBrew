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
  title: "HeBrew - Learn Hebrew",
  description: "Learn Hebrew with conjugation, translation, and practice tools",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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
