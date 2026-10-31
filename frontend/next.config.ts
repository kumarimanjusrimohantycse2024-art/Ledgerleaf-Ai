import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Turbopack CSS loader for Tailwind */
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
