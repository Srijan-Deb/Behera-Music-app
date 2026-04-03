import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Edge Scalability: Compiles to pure static files for infinite CDN scaling
  output: "export",
  images: {
    unoptimized: true
  }
};

export default nextConfig;
