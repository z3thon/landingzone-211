/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  // Turbopack configuration (Next.js 16 uses Turbopack by default)
  turbopack: {},
}

module.exports = nextConfig


