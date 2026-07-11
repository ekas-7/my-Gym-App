import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  // Silence Turbopack warnings
  turbopack: {
    root: __dirname,
  },
  experimental: {
    optimizePackageImports: [
      "firebase/app",
      "firebase/auth",
      "firebase/firestore",
    ],
  },
};

export default nextConfig;
