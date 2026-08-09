import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "جیم‌اپ — مدیریت حرفه‌ای باشگاه ورزشی",
    template: "%s | جیم‌اپ",
  },
  description: "مدیریت اشتراک‌ها، اعضا، پرداخت‌ها، برنامه تمرینی و حضور و غیاب باشگاه ورزشی — سامانه هوشمند باشگاه",
  keywords: [
    "باشگاه ورزشی",
    "مدیریت باشگاه",
    "برنامه تمرینی",
    "حضور و غیاب",
    "اشتراک ورزشی",
    "QR کد",
    "جیم‌اپ",
  ],
  authors: [{ name: "جیم‌اپ (Gym App)" }],
  creator: "جیم‌اپ",
  publisher: "جیم‌اپ",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "جیم‌اپ — مدیریت حرفه‌ای باشگاه ورزشی",
    description: "سامانه هوشمند مدیریت باشگاه با پنل اعضا، مربیان و مدیریت",
    url: "https://gym-app.vercel.app",
    siteName: "جیم‌اپ",
    locale: "fa_IR",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "جیم‌اپ — مدیریت باشگاه ورزشی",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "جیم‌اپ — مدیریت حرفه‌ای باشگاه ورزشی",
    description: "سامانه هوشمند مدیریت باشگاه",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    title: "جیم‌اپ",
    statusBarStyle: "black-translucent",
    startupImage: "/apple-touch-icon.png",
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#07091a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

import Providers from "@/components/providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className="font-vazirmatn scroll-smooth">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      </head>
      <body
        className="font-vazirmatn antialiased selection:bg-rose-500/20 selection:text-white"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <a href="#main-content" className="skip-link">پرش به محتوا</a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
