import type { Metadata, Viewport } from "next";
import { Vazirmatn, Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
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

// Twilight Meditation reference typefaces — Playfair Display (serif display)
// and Plus Jakarta Sans (sans body). Persian glyphs fall through to Vazirmatn.
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-playfair",
  display: "swap",
  preload: true,
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
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
    <html lang="fa" dir="rtl" suppressHydrationWarning className={`${vazirmatn.variable} ${playfair.variable} ${jakarta.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:right-4 focus:top-4 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">پرش به محتوا</a>
        <Providers>{children}</Providers>
        <PwaRegister />
      </body>
    </html>
  );
}
