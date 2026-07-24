const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
let apiMediaPattern;

try {
  const apiOrigin = new URL(apiUrl);
  apiMediaPattern = {
    protocol: apiOrigin.protocol.replace(":", ""),
    hostname: apiOrigin.hostname,
    port: apiOrigin.port,
    pathname: "/**"
  };
} catch {
  apiMediaPattern = null;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [320, 430, 768, 1024, 1280, 1440, 1920],
    remotePatterns: apiMediaPattern ? [apiMediaPattern] : []
  }
};

export default nextConfig;
