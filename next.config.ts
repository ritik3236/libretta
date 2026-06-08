import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Server Actions are stable in 15, listed here for clarity of intent.
  },
};

export default nextConfig;
