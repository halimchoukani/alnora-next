import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { SiteLayout } from "@/components/SiteLayout";
import { Toaster } from "sonner";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ALNORA — Fine Jewelry & Accessories",
  description: "Discover ALNORA's fine jewelry: diamond rings, gold bracelets and emerald necklaces in 18K gold and precious stones.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "ALNORA — Fine Jewelry & Accessories",
    description: "Discover ALNORA's fine jewelry: diamond rings, gold bracelets and emerald necklaces in 18K gold and precious stones.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${jost.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        <AuthProvider>
          <CartProvider>
            <SiteLayout>{children}</SiteLayout>
            <Toaster position="bottom-right" richColors />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
