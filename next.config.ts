import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Client-side Router Cache: reuse already-rendered pages on navigation so
    // switching tabs shows existing data instantly (no skeleton flash) instead
    // of re-fetching every time. Mutations call revalidatePath(), which busts
    // this cache so fresh data still appears right after an add/edit/delete.
    staleTimes: {
      dynamic: 60, // reuse a visited dynamic page for 60s
      static: 300,
    },
  },
};

export default nextConfig;
