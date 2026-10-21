import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";
const billingToolCsp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  `connect-src 'self'${isDevelopment ? " ws://localhost:* ws://127.0.0.1:*" : ""}`,
  "img-src 'self' data:",
  "font-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/tools/gpt-billing/:path*",
        headers: [
          { key: "Content-Security-Policy", value: billingToolCsp },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
    ];
  },
};

export default nextConfig;
