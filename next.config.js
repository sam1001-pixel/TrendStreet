/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
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
  // Production Enterprise Security Headers
  async headers() {
    const isHttpsDeployment =
      process.env.NODE_ENV === "production" &&
      (Boolean(process.env.VERCEL) ||
        process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://") ||
        process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://"));

    const upgradeDirective = isHttpsDeployment ? "upgrade-insecure-requests;" : "";

    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com https://js.stripe.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' blob: data: https://images.unsplash.com https://plus.unsplash.com;
      font-src 'self' https://fonts.gstatic.com data:;
      frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://js.stripe.com;
      connect-src 'self' https://api.razorpay.com https://api.stripe.com;
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
        key: "X-XSS-Protection",
        value: "1; mode=block",
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
        source: "/(api/admin/:path*|api/orders/:path*|admin/:path*|checkout|bag|profile|saved)",
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
