"use client";

import { useState, useEffect } from "react";

export function InstallPWABanner() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (navigator as any).standalone === true;
    const wasDismissed = localStorage.getItem("fittrack-pwa-dismissed") === "1";

    setIsIOS(ios);

    if (ios && !standalone && !wasDismissed) {
      // Show banner after 3 seconds
      const t = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem("fittrack-pwa-dismissed", "1");
  };

  if (!show || dismissed) return null;

  return (
    <div
      className="fixed bottom-28 left-4 right-4 z-50 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300"
      style={{
        background: "#1c1c1e",
        border: "1px solid rgba(0,218,243,0.3)",
        boxShadow: "0 8px 32px rgba(0,218,243,0.1)",
      }}
    >
      <div className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center text-2xl"
        style={{ background: "rgba(0,218,243,0.1)" }}>
        🏋️
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-headline text-sm" style={{ color: "#e5e2e1" }}>
          Add FitTrack to Home Screen
        </p>
        <p className="font-body text-xs mt-0.5" style={{ color: "#bac9cc" }}>
          Tap <strong style={{ color: "#00daf3" }}>Share</strong> then{" "}
          <strong style={{ color: "#00daf3" }}>"Add to Home Screen"</strong> for the best experience
        </p>
      </div>
      <button onClick={dismiss} className="text-lg leading-none shrink-0" style={{ color: "#849396" }}>
        ✕
      </button>
    </div>
  );
}
