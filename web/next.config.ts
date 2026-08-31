import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Required for WebMCP origin isolation
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
          // Permissions Policy: enable tools API
          { key: "Permissions-Policy", value: "tools=(self)" },
        ],
      },
    ];
  },
};

export default nextConfig;
