
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.nzerutechsolutions.com",
        pathname: "/storage/**",
      },
      {
        protocol: "https",
        hostname: "mvips-api.nzerutechsolutions.com",
        pathname: "/storage/**",
      },
    ],
  },

  experimental: {
    webpackMemoryOptimizations: true,
  },

  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
