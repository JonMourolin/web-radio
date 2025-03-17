import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export async function GET() {
  try {
    // Initialiser Redis
    const redis = Redis.fromEnv();
    console.log('Redis initialisé avec succès');

    // Clé de test
    const testKey = 'radio:test';
    
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
    }, { status: 500 });
  }
} 