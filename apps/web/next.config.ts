import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // No static export — uses Node.js server on Vercel for API Routes + NextAuth
  transpilePackages: ['@x-harness/x-sdk', '@x-harness/shared'],
};

export default nextConfig;
