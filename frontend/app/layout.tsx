import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import "./globals.css";

/* ── Kinetic Obsidian Typography ────────────────────────────────────────────
   Geist — engineered Swiss-inspired sans for all display/body copy
   JetBrains Mono — reserved for label-caps / data strings
*/
const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: false,
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "FitTrack – Kinetic Performance",
  description: "Track hydration, nutrition, training & streaks. Your personal AI fitness coach.",
  applicationName: "FitTrack",
  authors: [{ name: "FitTrack" }],
  keywords: ["fitness", "workout", "nutrition", "hydration", "health", "tracker"],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FitTrack",
    startupImage: [
      {
        url: "/apple-touch-icon.png",
        media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)",
      },
    ],
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    title: "FitTrack – Kinetic Performance",
    description: "AI-powered fitness tracker for hydration, nutrition & training",
    images: [{ url: "/icon-512x512.png", width: 512, height: 512 }],
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [{ rel: "mask-icon", url: "/icon-512x512.png" }],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)",  color: "#131313" },
    { media: "(prefers-color-scheme: light)", color: "#e9edf2" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://firestore.googleapis.com" />
        <link rel="preconnect" href="https://identitytoolkit.googleapis.com" />
        <link rel="preconnect" href="https://securetoken.googleapis.com" />
        <link rel="dns-prefetch" href="https://lh3.googleusercontent.com" />

        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="FitTrack" />

        <style>{`
          * { -webkit-tap-highlight-color: transparent; -webkit-touch-callout: none; }
          input, textarea, select { -webkit-appearance: none; }
        `}</style>
      </head>
      <body className={`${geist.variable} ${geistMono.variable} ${jetbrainsMono.variable} antialiased`}>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
