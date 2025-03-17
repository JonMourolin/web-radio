import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const runtime = 'nodejs';

export async function GET() {
  try {
    // Configuration explicite des informations Redis
    const redisUrl = process.env.KV_REST_API_URL || '';
    const redisToken = process.env.KV_REST_API_TOKEN || '';
    
    // Afficher les informations de connexion (versions masquées) pour le débogage
    console.log(`Redis URL: ${redisUrl ? 'Définie' : 'Non définie'}`);
    console.log(`Redis Token: ${redisToken ? 'Défini' : 'Non défini'}`);
    
    // Initialiser Redis
    const redis = new Redis({
      url: redisUrl,
      token: redisToken
    });
    console.log('Redis initialisé avec succès avec configuration directe');

    // Clé de test
    const testKey = 'radio:test:v2';
    
    // Récupérer la valeur actuelle
    const currentValue = await redis.get(testKey);
    
    // Incrémenter ou initialiser la valeur
    const newValue = currentValue ? parseInt(currentValue.toString()) + 1 : 1;
    
    // Stocker la nouvelle valeur
    await redis.set(testKey, newValue);
    
    // Récupérer la valeur mise à jour pour confirmer
    const updatedValue = await redis.get(testKey);
    
    return NextResponse.json({
      status: 'success',
      message: 'Test Redis réussi',
      initialValue: currentValue,
      newValue: updatedValue,
      env: {
        KV_URL: process.env.KV_URL ? 'Défini' : 'Non défini',
        KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN ? 'Défini' : 'Non défini',
        KV_REST_API_URL: process.env.KV_REST_API_URL ? 'Défini' : 'Non défini'
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Erreur lors du test Redis:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Test Redis échoué',
      error: error instanceof Error ? error.message : String(error),
      env: {
        KV_URL: process.env.KV_URL ? 'Défini' : 'Non défini',
        KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN ? 'Défini' : 'Non défini',
        KV_REST_API_URL: process.env.KV_REST_API_URL ? 'Défini' : 'Non défini'
      }
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Content-Type': 'application/json'
      }
    });
  }
} 