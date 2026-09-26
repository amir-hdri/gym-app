import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  experimental: {
    // A/B-tested 2026-09-26: inlining the 120KB Tailwind sheet duplicates it in
    // the RSC payload (HTML 4.4KB -> 74KB gz) and pushed FCP 1234 -> 1371ms.
    // External stylesheet stays: one small, cacheable request.
    inlineCss: false,
  },
  turbopack: {
    root: resolve(__dirname, "..", ".."),
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
