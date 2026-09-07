import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Activa el MCP server en /_next/mcp (Next.js 16+)
  experimental: {
    mcpServer: true,
  },
  turbopack: {
    root: __dirname,
  },
  // sharp tiene un binario nativo: se usa en los route handlers de PDF para
  // convertir fotos de producto (a menudo .webp) a PNG, que es lo unico que
  // @react-pdf/renderer sabe leer. Si se empaqueta en vez de tratarse como
  // externo, el binario nativo se rompe en produccion.
  serverExternalPackages: ['sharp'],
}

export default nextConfig
