import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // pixi.js ships ESM that Next needs to process for the client bundle.
  transpilePackages: ['pixi.js'],
  // Pin the workspace root so the build doesn't pick up a parent lockfile.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
