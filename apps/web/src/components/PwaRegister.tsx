"use client";

import { useEffect, useState } from "react";
import { X, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function PwaRegister() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // show install banner only if not already installed
      if (!window.matchMedia("(display-mode: standalone)").matches) {
        setShowInstall(true);
      }
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall as any);

    const onAppInstalled = () => {
      setShowInstall(false);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", onAppInstalled);

    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          reg.addEventListener("updatefound", () => {
            const sw = reg.installing;
            if (!sw) return;
            sw.addEventListener("statechange", () => {
              if (sw.state === "installed" && navigator.serviceWorker.controller) {
                setNeedRefresh(true);
              }
            });
          });
          // listen for controller change
          navigator.serviceWorker.addEventListener("controllerchange", () => {
            // new worker took over
          });
          if (reg.active) {
            // ready
          }
        })
        .catch((err) => console.error("SW register failed", err));

      // listen for messages from SW
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data?.type === "OFFLINE_READY") setOfflineReady(true);
      });
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall as any);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") setShowInstall(false);
    setDeferredPrompt(null);
  };

  const handleUpdate = () => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        reg?.waiting?.postMessage("SKIP_WAITING");
      });
    }
    window.location.reload();
  };

  const bannerVisible = showInstall || needRefresh;

  // While the banner is visible it can cover the landing hero CTA at short
  // viewports (no bottom tab bar on `/`); the CSS rule on
  // body[data-pwa-banner="visible"] gives the page bottom breathing room.
  useEffect(() => {
    if (bannerVisible) {
      document.body.setAttribute("data-pwa-banner", "visible");
    } else {
      document.body.removeAttribute("data-pwa-banner");
    }
  }, [bannerVisible]);

  return (
    <>
      {showInstall && (
        <div className="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 flex items-center gap-3 rounded-2xl border border-primary/20 bg-card p-3 shadow-xl backdrop-blur-xl md:inset-x-auto md:left-1/2 md:w-[420px] md:-translate-x-1/2 lg:bottom-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
            <Download className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">نصب Lumi Wellness</p>
            <p className="text-xs text-muted-foreground">دسترسی سریع مثل اپ نیتیو — بدون نیاز به استور</p>
          </div>
          <Button size="sm" onClick={handleInstall} className="shrink-0">
            نصب
          </Button>
          <button
            onClick={() => setShowInstall(false)}
            aria-label="بستن"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {needRefresh && (
        <div className="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 shadow-xl dark:border-amber-900 dark:bg-amber-950 md:inset-x-auto md:left-1/2 md:w-[420px] md:-translate-x-1/2 lg:bottom-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
            <RefreshCw className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">نسخه جدید در دسترس است</p>
            <p className="text-xs text-amber-700 dark:text-amber-300">برای دریافت آخرین تغییرات بروزرسانی کنید</p>
          </div>
          <Button size="sm" onClick={handleUpdate} className="shrink-0 bg-amber-600 hover:bg-amber-700">
            بروزرسانی
          </Button>
          <button onClick={() => setNeedRefresh(false)} aria-label="بستن" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-amber-700 hover:bg-amber-100 dark:text-amber-300">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {offlineReady && (
        <div className="sr-only" aria-live="polite">آماده برای استفاده آفلاین</div>
      )}
    </>
  );
}
