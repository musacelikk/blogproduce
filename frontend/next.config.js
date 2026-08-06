/**
 * Host of the asset CDN/bucket, when it is not a plain S3 URL — e.g. a
 * CloudFront distribution or a custom domain matching the backend's
 * AWS_S3_PUBLIC_URL. next/image refuses any host that is not listed here, so an
 * unlisted domain makes every uploaded image fail to render with a 400.
 */
const assetHost = (() => {
  const raw = process.env.NEXT_PUBLIC_ASSET_HOST;
  if (!raw) return null;
  try {
    return new URL(raw.includes('://') ? raw : `https://${raw}`).hostname;
  } catch {
    return null;
  }
})();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'hebbkx1anhila5yf.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      // Uploaded assets. Both S3 URL styles are matched because the bucket name
      // is deployment-specific: virtual-hosted (bucket.s3.region.amazonaws.com)
      // and path-style (s3.region.amazonaws.com/bucket).
      {
        protocol: 'https',
        hostname: '**.s3.**.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 's3.**.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.cloudfront.net',
        port: '',
        pathname: '/**',
      },
      ...(assetHost
        ? [{ protocol: 'https', hostname: assetHost, port: '', pathname: '/**' }]
        : []),
    ],
  },
  // Subdomain routing için headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

