import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production builds use webpack + postcss.config.mjs (Tailwind v4 via @tailwindcss/postcss)
  // Dev server uses: `next dev --turbopack` (via CLI flag), not configured here
};

export default nextConfig;
