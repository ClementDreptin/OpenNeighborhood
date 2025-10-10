import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    reactCompiler: true,
  },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
