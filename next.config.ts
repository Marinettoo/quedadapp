import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Por defecto Next.js limita el cuerpo de las Server Actions a 1 MB;
    // la subida de fotos de perfil necesita más margen (hasta 4 MB).
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
