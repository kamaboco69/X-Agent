import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  transpilePackages: ['@x-harness/x-sdk', '@x-harness/shared'],
  // Monorepo root (two levels up from apps/web) — silences lockfile inference warning
  outputFileTracingRoot: path.join(__dirname, '../../'),
  webpack: (config) => {
    // Allow .js imports to resolve .ts source files in transpiled workspace packages
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
    };
    return config;
  },
};

export default nextConfig;
