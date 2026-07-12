import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Media uploads are posted through a Server Action, and Next caps those
      // bodies at 1 MB by default — which rejects almost every real photo. The
      // API's own limits are the real guard: images ≤ 8 MB, audio/video ≤ 200 MB.
      bodySizeLimit: '210mb',
    },
  },
};

export default nextConfig;
