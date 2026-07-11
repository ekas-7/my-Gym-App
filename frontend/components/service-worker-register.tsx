"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none", // always fetch sw.js fresh from network
        });

        // When the new SW takes control, reload for fresh assets.
        // controllerchange is the most reliable signal on iOS Safari PWA.
        let reloading = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (reloading) return;
          reloading = true;
          window.location.reload();
        });

        // Also poll for updates every 30 s while the app is open
        setInterval(() => registration.update(), 30_000);

        // Trigger an immediate update check on registration
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
