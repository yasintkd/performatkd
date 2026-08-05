/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, s-maxage=0, must-revalidate, no-store' },
        ],
      },
    ]
  },
}

export default nextConfig