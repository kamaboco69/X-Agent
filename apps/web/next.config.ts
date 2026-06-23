import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@x-harness/x-sdk', '@x-harness/shared'],
  webpack: (config) => {
    // Allow .js imports to resolve .ts source files in transpiled workspace packages
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
    };
    return config;
  },
};

export default nextConfig;
