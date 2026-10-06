import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Images are resized in the browser first; this is headroom, below Vercel's 4.5 MB cap
      bodySizeLimit: "4mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
      }
    ],
  },
}

export default nextConfig
