import type { Metadata, Viewport } from "next";
import { Sora, Manrope, JetBrains_Mono } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  preload: true,
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: true,
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["500"],
  display: "swap",
  preload: false, // only used for data labels — lazy is fine
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
  formatDetection: {
    telephone: false,
  },
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
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/icon-512x512.png" },
    ],
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
    { media: "(prefers-color-scheme: dark)",  color: "#080808" },
    { media: "(prefers-color-scheme: light)", color: "#f0f2f5" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Preconnect to critical third-party origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://firestore.googleapis.com" />
        <link rel="preconnect" href="https://identitytoolkit.googleapis.com" />
        <link rel="preconnect" href="https://securetoken.googleapis.com" />
        <link rel="dns-prefetch" href="https://lh3.googleusercontent.com" />

        {/* iOS full-screen webapp */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="FitTrack" />

        {/* Prevent tap callout & selection highlight on iOS */}
        <style>{`
          * { -webkit-tap-highlight-color: transparent; -webkit-touch-callout: none; }
          input, textarea, select { -webkit-appearance: none; }
        `}</style>
      </head>
      <body className={`${sora.variable} ${manrope.variable} ${jetbrainsMono.variable} antialiased font-body`}>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
