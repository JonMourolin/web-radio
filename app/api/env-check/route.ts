import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  // Liste des clés d'environnement à vérifier
  const keysToCheck = [
    'KV_URL',
    'KV_REST_API_URL',
    'KV_REST_API_TOKEN',
    'KV_REST_API_READ_ONLY_TOKEN',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'VERCEL_ENV',
    'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'DISCOGS_CONSUMER_KEY',
    'DISCOGS_CONSUMER_SECRET'
  ];

  // Vérifier quelles variables sont définies
  const envStatus: Record<string, string> = {};
  keysToCheck.forEach(key => {
    // Ne pas exposer les valeurs complètes, juste indiquer si elles sont définies
    const value = process.env[key];
    if (value) {
      // Pour les tokens et clés API, masquer la valeur pour des raisons de sécurité
      if (key.includes('TOKEN') || key.includes('KEY') || key.includes('SECRET')) {
        envStatus[key] = `Défini (${value.substring(0, 4)}...${value.substring(value.length - 4)})`;
      } else if (key.includes('URL')) {
        // Pour les URLs, on peut les montrer partiellement
        envStatus[key] = `Défini (${value.substring(0, 15)}...${value.substring(value.length - 10)})`;
      } else {
        envStatus[key] = 'Défini';
      }
    } else {
      envStatus[key] = 'Non défini';
    }
  });

  // Ajouter des informations sur l'environnement
  const envInfo = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV || 'Non défini',
    SERVER_TIME: new Date().toISOString()
  };

  return NextResponse.json({
    status: 'success',
    message: 'Vérification des variables d\'environnement',
    environment: envInfo,
    variables: envStatus
  }, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'Content-Type': 'application/json'
    }
  });
} 