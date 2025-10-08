/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during builds for deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript checking during builds for deployment
    ignoreBuildErrors: true,
  },
  // Domain configuration
  images: {
    domains: ['voiceflyai.com', 'www.voiceflyai.com', 'localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.voiceflyai.com',
      },
      {
        protocol: 'https',
        hostname: 'kqsquisdqjedzenwhrkl.supabase.co',
      },
    ],
  },
  // Production URL configuration
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://voiceflyai.com',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://voiceflyai.com/api',
  },
  // Redirects
  async redirects() {
    return [
      {
        source: '/www',
        destination: '/',
        permanent: true,
      },
    ]
  },
  // Headers for security and CORS
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: 'https://voiceflyai.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ]
  },
}

module.exports = nextConfig