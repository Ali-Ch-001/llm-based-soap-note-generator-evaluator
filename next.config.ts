import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@xenova/transformers', 'sharp', 'onnxruntime-node'],
  // Force webpack for compatibility with transformers.js custom config
  // if user runs with defaults, but we should probably just remove the webpack config if we can.
  // However, for transformers.js, ignoring 'sharp' in browser bundle is often needed.
  // Let's rely on 'serverExternalPackages' handling most of it.
  // And remove the explicit webpack config for now to try to build with Turbopack defaults,
  // OR we keep it and run with --webpack.
  // Let's keep it simple: valid config first.
};

export default nextConfig;
