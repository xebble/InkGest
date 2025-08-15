const withNextIntl = require('next-intl/plugin')('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable React Strict Mode for React 19 compatibility
  reactStrictMode: false,
  experimental: {
    typedRoutes: true,
    // Optimize for React 19 and Next.js 15
    optimizePackageImports: ['lucide-react', 'date-fns'],
    // React 19 specific optimizations
    reactCompiler: false,
  },
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  eslint: {
    dirs: ['app', 'components', 'lib', 'utils', 'hooks', 'services'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  // Webpack configuration to fix module loading issues with Next.js 15 + React 19
  webpack: (config, { isServer, dev }) => {
    // Fix for module resolution issues in Next.js 15 with React 19
    const path = require('path');
    const rootNodeModules = path.resolve(__dirname, '../../node_modules');
    
    config.resolve.alias = {
      ...config.resolve.alias,
      // Force single React instance to prevent useContext issues
      'react': path.resolve(rootNodeModules, 'react'),
      'react-dom': path.resolve(rootNodeModules, 'react-dom'),
      'react/jsx-runtime': path.resolve(rootNodeModules, 'react/jsx-runtime'),
      'react/jsx-dev-runtime': path.resolve(rootNodeModules, 'react/jsx-dev-runtime'),
      // Additional React 19 specific aliases
      'react-dom/client': path.resolve(rootNodeModules, 'react-dom/client'),
      'react-dom/server': path.resolve(rootNodeModules, 'react-dom/server'),
      // Ensure scheduler consistency
      'scheduler': path.resolve(rootNodeModules, 'scheduler'),
    };

    // Note: dedupe is handled by Next.js internally

    // Add root node_modules to resolve paths
    config.resolve.modules = [
      path.resolve(__dirname, 'node_modules'),
      rootNodeModules,
      'node_modules'
    ];

    // Apply aliases to server-side as well
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'react': path.resolve(rootNodeModules, 'react'),
        'react-dom': path.resolve(rootNodeModules, 'react-dom'),
        'scheduler': path.resolve(rootNodeModules, 'scheduler'),
      };
    }

    // Fix for module resolution issues in Next.js 15
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          chunks: 'all',
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            // Ensure vendor chunks are properly handled
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            // Separate chunk for React and Next.js core
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
              name: 'react-vendor',
              chunks: 'all',
              priority: 20,
            },
            // Common chunk for shared components
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
              reuseExistingChunk: true,
            },
            default: {
              minChunks: 2,
              priority: -10,
              reuseExistingChunk: true,
            },
          },
        },
      };

      // Add fallbacks for Node.js modules in client-side bundles
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    return config;
  },
  // Output configuration for better chunk handling
  output: 'standalone',
};

module.exports = withNextIntl(nextConfig);