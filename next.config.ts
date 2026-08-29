import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    portfolioData: {
      stale: 300, // 5 minutes
      revalidate: 1800, // 30 minutes
      expire: 7200, // 2 hours
    },
  },
};

export default nextConfig;
