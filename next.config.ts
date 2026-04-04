import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Edge Scalability: Compiles to pure static files for infinite CDN scaling
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true
  }
};

export default nextConfig;
