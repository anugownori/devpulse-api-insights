/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'supabase.co'],
  },
  staticPageGenerationTimeout: 300,
  // Disable static generation for dynamic pages that cause issues
  async redirects() {
    return [];
  },
  async rewrites() {
    return [];
  },
};

export default nextConfig;
