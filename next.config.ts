import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel handles output automatically; no "standalone" needed
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  outputFileTracingIncludes: {
    "/api/**/*": ["./node_modules/@prisma/client/**/*", "./prisma/**/*"],
  },
};

export default nextConfig;
