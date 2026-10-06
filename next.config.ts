import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Images are resized in the browser first; this is headroom, below Vercel's 4.5 MB cap
      bodySizeLimit: "4mb",
    },
  },
  images: {
    // Images are resized in the browser when uploaded (avatars 512px, news
    // 1600px, gallery 480px thumbnails + 2000px), so they're served as-is:
    // no Vercel image-optimization quota or cost.
    unoptimized: true,
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
