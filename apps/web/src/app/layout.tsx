import type { Metadata, Viewport } from "next";
import { Vazirmatn, Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { PwaRegister } from "@/components/PwaRegister";

const vazirmatn = Vazirmatn({
  subsets: ["latin", "arabic"],
  weight: ["100", "300", "400", "500", "700", "900"],
  variable: "--font-vazirmatn",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["100", "300", "400", "600", "800"],
  variable: "--font-outfit",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://gymapp.ir"),
  title: {
    default: "جیم‌آپ | مدیریت هوشمند باشگاه ورزشی",
    template: "%s | جیم‌آپ",
  },
  description: "پلتفرم جامع مدیریت باشگاه، مربیان و ورزشکاران با قابلیت‌های برنامه‌ریزی تمرین، اشتراک، چک‌این و گزارش‌گیری",
  keywords: ["باشگاه", "ورزش", "مربی", "ورزشکار", "اشتراک", "برنامه تمرینی", "چک‌این"],
  authors: [{ name: "GymApp Team" }],
  creator: "GymApp",
  publisher: "GymApp",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: "https://gymapp.ir",
    siteName: "جیم‌آپ",
    title: "جیم‌آپ | مدیریت هوشمند باشگاه ورزشی",
    description: "پلتفرم جامع مدیریت باشگاه، مربیان و ورزشکاران",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "جیم‌آپ - مدیریت باشگاه ورزشی",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "جیم‌آپ | مدیریت هوشمند باشگاه ورزشی",
    description: "پلتفرم جامع مدیریت باشگاه، مربیان و ورزشکاران",
    images: ["/og-image.svg"],
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/favicon.svg", sizes: "180x180", type: "image/svg+xml" }],
  },
  manifest: "/site.webmanifest",
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-title": "جیم‌آپ",
    "apple-mobile-web-app-status-bar-style": "default",
    "mobile-web-app-capable": "yes",
    "application-name": "جیم‌آپ",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
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
    <html lang="fa" dir="rtl" suppressHydrationWarning className={`${vazirmatn.variable} ${outfit.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased bg-dot-pattern">
        <Providers>{children}</Providers>
        <PwaRegister />
      </body>
    </html>
  );
}
