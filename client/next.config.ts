import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // Disable ESLint errors during production builds to prevent build failures
  eslint: {
    ignoreDuringBuilds: true,
  },
  devIndicators: false,
  /* config options here */
};

export default nextConfig;
