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
  // Use webpack for server-side builds to handle Discord.js dependencies
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude problematic packages from server-side bundle
      config.externals = config.externals || []
      config.externals.push({
        'zlib-sync': 'commonjs zlib-sync',
        'bufferutil': 'commonjs bufferutil',
        'utf-8-validate': 'commonjs utf-8-validate',
      })
    }
    return config
  },
  // Empty turbopack config to allow webpack to be used
  turbopack: {},
}

module.exports = nextConfig


