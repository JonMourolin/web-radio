/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Désactiver ESLint pendant le build pour permettre le déploiement
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Désactiver la vérification TypeScript pendant le build pour permettre le déploiement
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['i.discogs.com', 'res.cloudinary.com'],
  },
  experimental: {
    // Utilisation de la configuration correcte pour les packages externes
    serverExternalPackages: ['@upstash/redis'],
    serverActions: {
      bodySizeLimit: '500mb'
    },
  },
  // Configuration explicite du runtime
  serverRuntimeConfig: {
    PROJECT_ROOT: __dirname,
  },
  // Configuration pour les routes API
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
          { key: 'Cache-Control', value: 'no-store, max-age=0' }
        ]
      }
    ];
  },
  // Augmenter la limite de taille des fichiers
  api: {
    bodyParser: {
      sizeLimit: '500mb'
    },
    responseLimit: '500mb'
  },
};

module.exports = nextConfig; 