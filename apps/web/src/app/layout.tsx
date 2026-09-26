import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { PwaRegister } from "@/components/PwaRegister";

const vazirmatn = Vazirmatn({
  // `latin` is preloaded too (not just the Persian/Arabic glyphs) so the
  // "Lumi Wellness" wordmark never waits for a second, CSS-discovered request.
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "900"],
  variable: "--font-vazirmatn",
  display: "swap",
  preload: true,
});

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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F7F9" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
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
    <html lang="fa" dir="rtl" suppressHydrationWarning className={vazirmatn.variable}>
      <body className="min-h-screen bg-background antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:right-4 focus:top-4 focus:rounded-lg focus:bg-primary-solid focus:px-4 focus:py-2 focus:text-white">پرش به محتوا</a>
        <Providers>{children}</Providers>
        <PwaRegister />
      </body>
    </html>
  );
}
