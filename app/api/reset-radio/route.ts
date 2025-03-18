import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { v2 as cloudinary } from 'cloudinary';

// Clé Redis pour l'état de la radio
const RADIO_STATE_KEY = 'radio:state:v2';

// Configuration directe de Redis avec URL et Token
const redisUrl = process.env.KV_REST_API_URL || '';
const redisToken = process.env.KV_REST_API_TOKEN || '';

// Initialiser Redis avec configuration explicite
const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Fonction pour récupérer les pistes depuis Cloudinary
async function fetchTracksFromCloudinary() {
  try {
    console.log('Récupération des pistes depuis Cloudinary...');
    
    // Get all resources from the web-radio/tracks folder with their context
    const result = await cloudinary.search
      .expression('folder:web-radio/tracks/*')
      .with_field('context')
      .execute();

    if (!result.resources || result.resources.length === 0) {
      console.log('Aucune piste trouvée dans Cloudinary, utilisation de pistes par défaut');
      return getDefaultTracks();
    }

    console.log(`${result.resources.length} pistes trouvées dans Cloudinary`);
    
    const tracks = result.resources.map((resource: any) => {
      const context = resource.context || {};
      
      return {
        filename: resource.filename,
        title: context.title || resource.filename.split('.')[0],
        artist: context.artist || 'Unknown Artist',
        album: context.album || 'Unknown Album',
        duration: parseFloat(context.duration) || 180, // Durée par défaut de 3 minutes
        coverUrl: context.coverUrl || '',
        cloudinaryUrl: resource.secure_url,
        cloudinaryPublicId: resource.public_id,
      };
    });

    return tracks;
  } catch (error) {
    console.error('Erreur lors de la récupération des pistes depuis Cloudinary:', error);
    return getDefaultTracks();
  }
}

// Fonction pour obtenir des pistes par défaut en cas de problème
function getDefaultTracks() {
  console.log('Utilisation des pistes par défaut');
  return [
    {
      filename: "default-track-1.mp3",
      title: "Default Track 1",
      artist: "Radio Artist",
      album: "Default Album",
      duration: 180,
      cloudinaryUrl: "https://res.cloudinary.com/dyom5zfbh/video/upload/v1710572802/web-radio/tracks/sample-15s_z4wr4o.mp3",
      cloudinaryPublicId: "web-radio/tracks/sample-15s_z4wr4o",
      coverUrl: "https://res.cloudinary.com/dyom5zfbh/image/upload/v1742158676/web-radio-assets/wyzcqttcvbdhzuf3cuvn.jpg"
    },
    {
      filename: "default-track-2.mp3",
      title: "Default Track 2",
      artist: "Radio Artist",
      album: "Default Album",
      duration: 180,
      cloudinaryUrl: "https://res.cloudinary.com/dyom5zfbh/video/upload/v1710572802/web-radio/tracks/sample-15s_z4wr4o.mp3",
      cloudinaryPublicId: "web-radio/tracks/sample-15s_z4wr4o",
      coverUrl: "https://res.cloudinary.com/dyom5zfbh/image/upload/v1742158676/web-radio-assets/wyzcqttcvbdhzuf3cuvn.jpg"
    }
  ];
}

export async function GET(request: NextRequest) {
  try {
    // Récupérer l'état actuel pour diagnostic
    const currentState = await redis.get(RADIO_STATE_KEY);
    
    // Créer un état de diagnostic
    const diagnosticInfo = {
      currentState,
      redisConnection: {
        url: redisUrl ? 'Configuré' : 'Non configuré',
        token: redisToken ? 'Configuré' : 'Non configuré'
      },
      cloudinaryConfig: {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? 'Configuré' : 'Non configuré',
        apiKey: process.env.CLOUDINARY_API_KEY ? 'Configuré' : 'Non configuré',
        apiSecret: process.env.CLOUDINARY_API_SECRET ? 'Configuré' : 'Non configuré'
      }
    };
    
    return NextResponse.json(diagnosticInfo);
  } catch (error) {
    console.error('Erreur lors du diagnostic Redis:', error);
    return NextResponse.json({ error: 'Erreur lors du diagnostic Redis' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Début de la réinitialisation de l\'état radio');
    
    // Récupérer les pistes depuis Cloudinary
    const tracks = await fetchTracksFromCloudinary();
    
    if (!tracks || tracks.length === 0) {
      console.error('Échec de la réinitialisation: aucune piste disponible');
      return NextResponse.json({ 
        error: 'Aucune piste disponible pour réinitialiser l\'état radio' 
      }, { status: 500 });
    }
    
    // Créer un nouvel état
    const newState = {
      currentTrack: tracks[0],
      position: 0,
      startTime: new Date(),
      isPlaying: true,
      tracks: tracks,
      currentTrackIndex: 0,
      lastChecked: new Date(),
    };
    
    console.log(`Réinitialisation de l'état radio avec ${tracks.length} pistes`);
    console.log(`Première piste: ${tracks[0].title} par ${tracks[0].artist}`);
    
    // Supprimer l'ancien état
    await redis.del(RADIO_STATE_KEY);
    
    // Enregistrer le nouvel état dans Redis
    await redis.set(RADIO_STATE_KEY, newState);
    
    return NextResponse.json({ 
      success: true, 
      message: 'État radio réinitialisé avec succès',
      trackCount: tracks.length,
      firstTrack: {
        title: tracks[0].title,
        artist: tracks[0].artist
      }
    });
  } catch (error) {
    console.error('Erreur lors de la réinitialisation de l\'état radio:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la réinitialisation de l\'état radio',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
} 