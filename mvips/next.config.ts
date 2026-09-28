import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.app.github.dev",
        pathname: "/storage/**",
      },
    ],
  },
};

export default nextConfig;