import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "جیم‌اپ — مدیریت حرفه‌ای باشگاه ورزشی",
  description: "مدیریت اشتراک‌ها، اعضا، پرداخت‌ها، برنامه تمرینی و حضور و غیاب باشگاه ورزشی",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#07091a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

import Providers from "@/components/providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className="font-vazirmatn">
      <head>
        <meta name="mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
      </head>
      <body className="font-vazirmatn" style={{paddingTop:"env(safe-area-inset-top)",paddingBottom:"env(safe-area-inset-bottom)"}}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
