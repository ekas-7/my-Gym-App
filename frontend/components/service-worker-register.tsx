"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    let reloading = false;
    const doReload = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none", // always fetch sw.js fresh from network
        });

        // Method 1: SW posts SW_UPDATED message on activate (most reliable on iOS)
        navigator.serviceWorker.addEventListener("message", (e) => {
          if (e.data?.type === "SW_UPDATED") doReload();
        });

        // Method 2: controllerchange fallback
        navigator.serviceWorker.addEventListener("controllerchange", doReload);

        // Poll for updates every 30s while app is open
        setInterval(() => registration.update(), 30_000);

        // Immediate update check on mount
        registration.update();
      } catch (err) {
        console.warn("SW registration failed:", err);
      }
    };

    if (document.readyState === "complete") {
      registerSW();
    } else {
      window.addEventListener("load", registerSW, { once: true });
    }
  }, []);

  return null;
}
