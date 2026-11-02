/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // AVIF is off: Next.js 14's image optimizer has an open security advisory for AVIF input/output
    // (GHSA-2xp9-vwfh-vxw4). Re-enable after upgrading to a patched Next.js release.
    formats: ["image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
    ],
  },
  // Removed pages send visitors to the shop (temporary redirects, so they're easy to bring back).
  async redirects() {
    return ["/lookbook", "/shop-your-way", "/complete-the-fit"].map((source) => ({
      source,
      destination: "/shop",
      permanent: false,
    }));
  },
  // Production Enterprise Security Headers
  async headers() {
    const isHttpsDeployment =
      process.env.NODE_ENV === "production" &&
      (Boolean(process.env.VERCEL) ||
        process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://") ||
        process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://"));

    const upgradeDirective = isHttpsDeployment ? "upgrade-insecure-requests;" : "";
    // 'unsafe-eval' is only needed by the dev server's hot reload, never in production.
    const devEval = process.env.NODE_ENV === "production" ? "" : "'unsafe-eval'";

    const cspHeader = `
      default-src 'self';
      script-src 'self' ${devEval} 'unsafe-inline' https://checkout.razorpay.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' blob: data: https://images.unsplash.com https://plus.unsplash.com;
      font-src 'self' https://fonts.gstatic.com data:;
      frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com;
      connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      ${upgradeDirective}
    `.replace(/\s{2,}/g, ' ').trim();

    const rootHeaders = [
      {
        key: "Content-Security-Policy",
        value: cspHeader,
      },
      ...(isHttpsDeployment
        ? [
            {
              key: "Strict-Transport-Security",
              value: "max-age=63072000; includeSubDomains; preload",
            },
          ]
        : []),
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=(self \"https://checkout.razorpay.com\")",
      },
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "X-Frame-Options",
        value: "DENY",
      },
      {
        // Modern guidance: disable the legacy XSS auditor (it can introduce leaks); CSP does this job.
        key: "X-XSS-Protection",
        value: "0",
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
    ];

    return [
      {
        source: "/(.*)",
        headers: rootHeaders,
      },
      {
        source: "/(api/admin/:path*|api/orders/:path*|api/auth/:path*|api/payment/:path*|admin/:path*|checkout|bag|profile|saved)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
