/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        pathname: "**",
      },
    ],
  },

  experimental: {
    // Restrict server actions to safe origins for production
    // For Arena preview environments, we keep flexibility
    serverActions: {
      allowedOrigins: [
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "localhost:3000",
        "https://*.e2b.app",
        "https://*.vercel.app",
        process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL).origin : "http://localhost:3000",
      ].filter(Boolean),
      allowedForwardedHosts: ["localhost:3000", "*.e2b.app", "*.vercel.app"],
    },
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
    }
    // Optimize bundle size for client
    if (!isServer) {
      config.resolve.fallback = { fs: false, net: false, tls: false, child_process: false };
    }
    return config;
  },

  transpilePackages: ["date-fns"],
};

module.exports = nextConfig;
