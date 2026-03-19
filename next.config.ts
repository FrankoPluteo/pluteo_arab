import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  images: {
    qualities: [75, 85],
  },
};

export default nextConfig;
