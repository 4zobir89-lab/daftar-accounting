import type { Metadata } from "next";
import { Cairo, Amiri } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AppProvider } from "@/components/app-provider";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const amiri = Amiri({
  subsets: ["arabic", "latin"],
  variable: "--font-amiri",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "دفتر المحاسب — نظام محاسبي تكاملي",
  description: "نظام محاسبة تكاملي احترافي بدفتر يومية مزدوج القيد، شجرة حسابات، تقارير، وكشوف حسابات PDF بنكية الاحتراف.",
  keywords: ["محاسبة", "كشف حساب", "دفتر يومية", "ميزان مراجعة", "PDF", "ريال سعودي", "ريال يمني"],
  authors: [{ name: "Daftar Accounting" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${cairo.variable} ${amiri.variable} antialiased bg-background text-foreground font-sans`}
      >
        <AppProvider>{children}</AppProvider>
        <Toaster />
      </body>
    </html>
  );
}
