/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Линт запускается отдельно: `npm run lint`.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
