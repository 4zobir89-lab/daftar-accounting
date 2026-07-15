import type { Metadata } from "next";
import { Cairo, Amiri, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { AppProvider } from "@/components/app-provider";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const amiri = Amiri({
  subsets: ["arabic", "latin"],
  variable: "--font-amiri",
  weight: ["400", "700"],
  display: "swap",
});

const ibmPlex = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  variable: "--font-ibm-plex",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "دفتر المحاسب — نظام المحاسبة الاحترافي",
  description:
    "نظام محاسبة تكاملي احترافي بدفتر يومية مزدوج القيد، شجرة حسابات، تقارير مالية متقدمة، وكشوف حسابات PDF بنكية الاحتراف.",
  keywords: [
    "محاسبة",
    "كشف حساب",
    "دفتر يومية",
    "ميزان مراجعة",
    "PDF",
    "ريال سعودي",
    "ريال يمني",
  ],
  authors: [{ name: "Daftar Accounting" }],
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#0a1f44",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {/* Prevent theme flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${cairo.variable} ${amiri.variable} ${ibmPlex.variable} antialiased font-sans`}
      >
        <ThemeProvider>
          <AppProvider>
            {children}
            <Toaster />
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
