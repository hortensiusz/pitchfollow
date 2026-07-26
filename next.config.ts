import type { NextConfig } from "next";
import path from "path";

const projectRoot = path.resolve(".");

const nextConfig: NextConfig = {
  // Pin roots to this project dir (a parent lockfile exists for build scripts,
  // which otherwise makes Next infer the wrong workspace root).
  turbopack: { root: projectRoot },
  outputFileTracingRoot: projectRoot,
  // Ensure the Chambers template .pptx is bundled into the /api/pptx serverless function
  outputFileTracingIncludes: {
    '/api/pptx': ['./templates/**'],
  },
};

export default nextConfig;
