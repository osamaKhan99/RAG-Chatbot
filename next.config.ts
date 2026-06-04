import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

/** Must match MAX_PDF_BYTES in src/app/upload/actions.ts */
const MAX_UPLOAD_MB = 5;

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],
  // Next.js 15 reads bodySizeLimit from experimental.serverActions (not top-level)
  experimental: {
    serverActions: {
      bodySizeLimit: `${MAX_UPLOAD_MB}mb`,
    },
  },
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
