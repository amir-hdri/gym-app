"use client";

import { useState, useSyncExternalStore } from "react";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/Button";

function subscribeOnline(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

function getOnlineSnapshot(): boolean {
  return navigator.onLine;
}

/**
 * The only way to reach this page is the service worker's offline fallback, so
 * both the server render and the hydration snapshot assume there is no
 * connection; the real value arrives on mount.
 */
function getOnlineServerSnapshot(): boolean {
  return false;
}

/**
 * The retry affordance has to be a client component: the page around it is
 * pre-rendered into the worker's cache at install time, so anything that
 * depends on the live connection state must be evaluated in the browser.
 */
export function OfflineRetry() {
  const online = useSyncExternalStore(
    subscribeOnline,
    getOnlineSnapshot,
    getOnlineServerSnapshot
  );
  const [retrying, setRetrying] = useState(false);

  const retry = () => {
    setRetrying(true);
    // A reload is the only honest retry: it re-runs the worker's network-first
    // navigation, so a restored connection serves the real page and a still
    // broken one lands back here.
    window.location.reload();
  };

  return (
    <div className="mt-7">
      <p
        aria-live="polite"
        className={
          online
            ? "flex items-center gap-2 rounded-2xl border border-success/25 bg-success/10 px-4 py-3 text-sm font-medium text-success"
            : "flex items-center gap-2 rounded-2xl border border-border bg-muted px-4 py-3 text-sm font-medium text-muted-foreground"
        }
      >
        {online ? (
          <Wifi className="h-4 w-4 shrink-0" aria-hidden="true" />
        ) : (
          <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        )}
        {online
          ? "اتصال برگشت. دکمه زیر را بزن تا صفحه دوباره از اینترنت باز شود."
          : "هنوز آفلاین هستی. اتصال که برگردد، همین‌جا خبرت می‌کنیم."}
      </p>

      <Button size="lg" onClick={retry} loading={retrying} className="mt-4 w-full sm:w-auto">
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        تلاش دوباره
      </Button>
    </div>
  );
}
