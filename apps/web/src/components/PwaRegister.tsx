"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const registerSW = async () => {
        try {
          const reg = await navigator.serviceWorker.register("/sw.js");
          console.log("Service Worker registered successfully:", reg.scope);

          reg.addEventListener("updatefound", () => {
            const worker = reg.installing;
            if (worker) {
              console.log("New service worker installing...");
              worker.addEventListener("statechange", () => {
                console.log("Service Worker state:", worker.state);
                if (worker.state === "installed") {
                  if (navigator.serviceWorker.controller) {
                    console.log("نسخه جدید در دسترس است. صفحه را refresh کنید.");
                  } else {
                    console.log("Service Worker installed for offline use.");
                  }
                }
              });
            }
          });

          if (reg.active) {
            console.log("Service Worker active for offline support.");
          }
        } catch (error) {
          console.error("Service Worker registration failed:", error);
        }
      };

      registerSW();
    } else {
      console.log("Service Workers not supported in this browser.");
    }
  }, []);

  return null;
}
