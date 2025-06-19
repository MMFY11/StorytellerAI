/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // “domains” is deprecated; use “remotePatterns” in ESM config
    remotePatterns: [
      {
        protocol: "https",
        hostname: "oaidalleapiprodscus.blob.core.windows.net",
        port: "",
        pathname: "/**/*",
      },
    ],
  },
};

export default nextConfig;
