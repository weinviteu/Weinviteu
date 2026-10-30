import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{
      source: '/template-assets/:path*',
      // Invitation previews have an opaque sandbox origin; fonts and canvas media need CORS.
      headers: [{ key: 'Access-Control-Allow-Origin', value: '*' }],
    }, {
      // Raw template files still load inside previews but are never the address shown in search.
      source: '/templates/:file(.*\\.html)',
      headers: [{ key: 'X-Robots-Tag', value: 'noindex' }],
    }];
  },
  serverExternalPackages: ['playwright-core', '@sparticuz/chromium', 'sharp'],
  outputFileTracingIncludes: {
    '/api/admin/templates': ['./node_modules/@sparticuz/chromium/bin/**/*'],
  },
  experimental: {
    // Allow a 100 MB template, a 3 MB cover, and multipart form overhead.
    proxyClientMaxBodySize: "105mb",
  },
};

export default config;
