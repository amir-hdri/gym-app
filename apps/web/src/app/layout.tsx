import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";
import { PwaRegister } from "@/components/PwaRegister";

/**
 * Self-hosted faces (no `next/font/google` — the Google-CDN fetch breaks
 * offline/proxied builds). Estedad leads the Persian UI; the classic
 * Vazirmatn stays behind it as a glyph fallback. Bodoni Moda + Montserrat
 * set the LUMI WELLNESS wordmark, matching the supplied brand SVG.
 */
const estedad = localFont({
  src: "./fonts/Estedad-arabic.woff2",
  weight: "100 900",
  variable: "--font-estedad",
  display: "swap",
  preload: true,
  fallback: ["Vazirmatn", "system-ui", "sans-serif"],
});
const estedadLatin = localFont({
  src: "./fonts/Estedad-latin.woff2",
  weight: "100 900",
  variable: "--font-estedad-latin",
  display: "swap",
  preload: false,
});

const vazirmatn = localFont({
  src: "./fonts/Vazirmatn.ttf",
  weight: "100 900",
  variable: "--font-vazirmatn",
  display: "swap",
  preload: false,
});

const bodoni = localFont({ src: "./fonts/BodoniModa-latin.woff2", weight: "400 900", variable: "--font-bodoni", display: "swap" });
const montserrat = localFont({ src: "./fonts/Montserrat-latin.woff2", weight: "100 900", variable: "--font-montserrat", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://gymapp.ir"),
  title: {
    default: "Lumi Wellness | مدیریت هوشمند باشگاه ورزشی",
    template: "%s | Lumi Wellness",
  },
  description: "پلتفرم جامع مدیریت باشگاه، مربیان و ورزشکاران با قابلیت‌های برنامه‌ریزی تمرین، اشتراک، چک‌این و گزارش‌گیری",
  keywords: ["باشگاه", "ورزش", "مربی", "ورزشکار", "اشتراک", "برنامه تمرینی", "چک‌این"],
  authors: [{ name: "Lumi Wellness Team" }],
  creator: "Lumi Wellness",
  publisher: "Lumi Wellness",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: "https://gymapp.ir",
    siteName: "Lumi Wellness",
    title: "Lumi Wellness | مدیریت هوشمند باشگاه ورزشی",
    description: "پلتفرم جامع مدیریت باشگاه، مربیان و ورزشکاران",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Lumi Wellness - مدیریت باشگاه ورزشی",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lumi Wellness | مدیریت هوشمند باشگاه ورزشی",
    description: "پلتفرم جامع مدیریت باشگاه، مربیان و ورزشکاران",
    images: ["/og-image.svg"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-title": "Lumi Wellness",
    "apple-mobile-web-app-status-bar-style": "default",
    "mobile-web-app-capable": "yes",
    "application-name": "Lumi Wellness",
  },
};

export const viewport: Viewport = {
  themeColor: "#0c0e12",
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
    <html lang="fa" dir="rtl" suppressHydrationWarning className={`${estedad.variable} ${estedadLatin.variable} ${vazirmatn.variable} ${bodoni.variable} ${montserrat.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:right-4 focus:top-4 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">پرش به محتوا</a>
        <Providers>{children}</Providers>
        <PwaRegister />
      </body>
    </html>
  );
}
