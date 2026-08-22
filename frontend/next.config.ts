import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        destination: "/login",
        permanent: false,
        source: "/",
      },
    ];
  },
};

export default nextConfig;
