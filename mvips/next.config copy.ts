import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  images: {
    remotePatterns: [
      // GitHub Codespaces forwarded backend
      {
        protocol: "https",
        hostname: "*.app.github.dev",
        pathname: "/storage/**",
      },
      // Local development backend
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/storage/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/storage/**",
      },
    ],
  },
};

export default nextConfig;