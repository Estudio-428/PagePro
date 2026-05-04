/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  output: 'standalone',
  async redirects() {
    return [
      { source: '/', destination: '/products', permanent: false },
      { source: '/settings', destination: '/products', permanent: false },
      { source: '/dashboard/settings', destination: '/products', permanent: false },
      { source: '/dashboard/products', destination: '/products', permanent: false },
      { source: '/dashboard/import', destination: '/import', permanent: false },
      { source: '/dashboard/editor', destination: '/editor', permanent: false },
    ];
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.join(__dirname, 'src');
    return config;
  },
};

module.exports = nextConfig;
