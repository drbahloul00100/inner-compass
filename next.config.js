/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Phase 1 has no images yet; safe defaults for Netlify
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
