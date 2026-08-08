import type { Metadata, Viewport } from "next";
import "./globals.css";

// Vazirmatn font via next/font fails in offline build env.
// Fallback to system stack with CSS that still tries to load Google Fonts at runtime via @import in globals.css
// This keeps build green while preserving Persian font when network available.
const vazirmatn = { className: "font-vazirmatn" } as const;

export const metadata: Metadata = {
  title: "جیم‌اپ — مدیریت حرفه‌ای باشگاه ورزشی",
  description: "مدیریت اشتراک‌ها، اعضا، پرداخت‌ها و حضور و غیاب باشگاه ورزشی",
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
    <html lang="fa" dir="rtl">
      <head>
        <meta name="mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
      </head>
      <body className={vazirmatn.className} style={{paddingTop:"env(safe-area-inset-top)",paddingBottom:"env(safe-area-inset-bottom)"}}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
