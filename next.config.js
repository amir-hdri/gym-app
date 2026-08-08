/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // In production, you should restrict allowedOrigins to your actual domains
    // For Arena preview and dev, we allow all origins to support dynamic preview hosts like https://{port}-{sandbox}.e2b.app
    serverActions: { 
      allowedOrigins: ["*"],
      allowedForwardedHosts: ["*"],
    },
  },
  // Ensure we handle Prisma properly
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      // Don't bundle prisma client in a way that breaks it
    }
    return config;
  },
  // Transpile packages if needed
  transpilePackages: [],
};

module.exports = nextConfig;
