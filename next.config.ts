import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/flows/index.html",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
