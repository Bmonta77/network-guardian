import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Set turbopack root at top-level to avoid invalid experimental keys
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
