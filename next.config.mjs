/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Demo/placeholder imagery is served from Unsplash. Swap or extend these
    // patterns when wiring a real Images provider (see src/lib/integrations/images).
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "source.unsplash.com" },
    ],
  },
  eslint: {
    // Lint is run explicitly via `npm run lint`; do not fail production builds on it.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
