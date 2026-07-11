import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  // Set turbopack root to THIS package's directory so it doesn't
  // traverse up to /Users/ekas/Desktop/package-lock.json
  turbopack: {
    root: path.resolve(__dirname),
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
