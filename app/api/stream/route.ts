import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { Redis } from '@upstash/redis';
import { revalidatePath } from 'next/cache';
import { Track } from '@/app/types/track';

// Configuration directe de Redis avec URL et Token
const redisUrl = process.env.KV_REST_API_URL || '';
const redisToken = process.env.KV_REST_API_TOKEN || '';

// Afficher si les variables d'environnement sont définies pour le débogage
console.log('Redis URL:', redisUrl ? 'Définie' : 'Non définie');
console.log('Redis Token:', redisToken ? 'Défini' : 'Non défini');

// Initialiser Redis avec configuration explicite
const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});

console.log('Upstash Redis initialisé avec succès avec configuration directe');

// Clé pour stocker l'état radio dans Redis
const RADIO_STATE_KEY = 'radio:state:v2';

// Dernière vérification d'avancement de piste
let lastTrackCheck = new Date();

// Ajouter un timeout plus long pour éviter les erreurs de connexion
const REDIS_TIMEOUT = 15000; // 15 secondes

// Marge de tolérance pour la fin des pistes (en secondes)
const END_TRACK_TOLERANCE = 2; // Ajoute 2 secondes de tolérance

interface RadioState {
  currentTrack: Track | null;
  position: number;
  startTime: Date;
  isPlaying: boolean;
  tracks: Track[];
  currentTrackIndex: number;
  lastChecked: Date;
}

// Fonction pour calculer l'heure du serveur avec corrections
const getServerTime = () => {
  return new Date();
};

// Pistes par défaut pour initialiser l'état si nécessaire
const defaultTracks = [
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

// Fonction de récupération de l'état radio avec gestion des erreurs et timeout
async function getRadioState(force = false): Promise<RadioState | null> {
  try {
    console.log('[Radio] Récupération de l\'état radio depuis la clé', RADIO_STATE_KEY);
    
    // Utiliser Promise.race pour ajouter un timeout
    const state = await Promise.race([
      redis.get(RADIO_STATE_KEY) as Promise<RadioState>,
      new Promise<null>((resolve) => {
        setTimeout(() => {
          console.log('[Radio] Timeout de la requête Redis après', REDIS_TIMEOUT, 'ms');
          resolve(null);
        }, REDIS_TIMEOUT);
      })
    ]);

    // Si l'état n'existe pas ou est invalide, créer un état par défaut
    if (!state || !state.tracks || !Array.isArray(state.tracks) || state.tracks.length === 0) {
      console.log('[Radio] État non trouvé ou invalide, création d\'un nouvel état par défaut');
      
      // Créer un nouvel état avec les pistes par défaut
      const defaultState: RadioState = {
        currentTrack: defaultTracks[0],
        position: 0,
        startTime: getServerTime(),
        isPlaying: true,
        tracks: defaultTracks,
        currentTrackIndex: 0,
        lastChecked: getServerTime(),
      };
      
      // Sauvegarder immédiatement dans Redis
      try {
        await redis.set(RADIO_STATE_KEY, defaultState);
        console.log('[Radio] État par défaut enregistré avec succès');
        return defaultState;
      } catch (saveError) {
        console.error('[Radio] Erreur lors de la sauvegarde de l\'état par défaut:', saveError);
        // Retourner l'état par défaut même en cas d'erreur Redis
        return defaultState;
      }
    }

    console.log('[Radio] État récupéré: Trouvé');
    console.log('[Radio] État récupéré:', state.tracks?.length || 0, 'pistes, piste actuelle:', state.currentTrackIndex);
    
    // Vérifier si l'état est cohérent
    if (!state.tracks || state.currentTrackIndex < 0 || state.currentTrackIndex >= state.tracks.length) {
      console.log('[Radio] État incohérent, réinitialisation avec pistes par défaut');
      
      // Réinitialiser l'état avec les pistes par défaut
      const fixedState: RadioState = {
        currentTrack: defaultTracks[0],
        position: 0,
        startTime: getServerTime(),
        isPlaying: true,
        tracks: defaultTracks,
        currentTrackIndex: 0,
        lastChecked: getServerTime(),
      };
      
      try {
        await redis.set(RADIO_STATE_KEY, fixedState);
        console.log('[Radio] État corrigé enregistré avec succès');
      } catch (saveError) {
        console.error('[Radio] Erreur lors de la sauvegarde de l\'état corrigé:', saveError);
      }
      
      return fixedState;
    }
    
    // Vérifier si une mise à jour de la position est nécessaire
    const now = getServerTime();
    
    // Si force=true ou si la dernière vérification date d'il y a plus de 30 secondes
    if (force || new Date(lastTrackCheck).getTime() + 30000 < now.getTime()) {
      console.log('[Radio] Vérification de l\'avancement de la piste (dernier contrôle:', lastTrackCheck, ')');
      
      // Vérifier si la piste en cours est terminée en calculant la position actuelle
      const startTime = new Date(state.startTime);
      const elapsedSeconds = (now.getTime() - startTime.getTime()) / 1000;
      
      // Mettre à jour la position dans l'état
      state.position = elapsedSeconds;
      state.lastChecked = now;
      
      // Vérifier si la piste est terminée et passer à la suivante si nécessaire
      const currentTrack = state.tracks[state.currentTrackIndex];
      
      // Utiliser la tolérance pour laisser la piste finir naturellement
      if (currentTrack && elapsedSeconds >= (currentTrack.duration + END_TRACK_TOLERANCE)) {
        console.log(`Track ${currentTrack.title} finished after ${elapsedSeconds.toFixed(3)}s. Duration was ${currentTrack.duration}s (with ${END_TRACK_TOLERANCE}s tolerance)`);
        
        // Passer à la piste suivante
        const nextIndex = (state.currentTrackIndex + 1) % state.tracks.length;
        const nextTrack = state.tracks[nextIndex];
        console.log(`Now playing: ${nextTrack.title} by ${nextTrack.artist}`);
        
        // Mettre à jour l'état avec la nouvelle piste
        state.currentTrackIndex = nextIndex;
        state.currentTrack = nextTrack;
        state.position = 0;
        state.startTime = now;
        
        console.log(`[Radio] Mise à jour de l'état radio: piste actuelle ${nextIndex}, démarrée à ${now.toISOString()}`);
        
        try {
          await redis.set(RADIO_STATE_KEY, state);
          console.log('[Radio] État mis à jour avec succès');
        } catch (error) {
          console.error('[Radio] Erreur lors de la mise à jour de l\'état:', error);
        }
      }
      
      // Mettre à jour la date de dernière vérification
      lastTrackCheck = now;
    } else {
      console.log('[Radio] Vérification ignorée - trop récente (dernier contrôle:', lastTrackCheck, ')');
    }

    return state;
  } catch (error) {
    console.error('[Radio] Erreur lors de la récupération de l\'état:', error);
    
    // En cas d'erreur, retourner un état par défaut
    const fallbackState: RadioState = {
      currentTrack: defaultTracks[0],
      position: 0,
      startTime: getServerTime(),
      isPlaying: true,
      tracks: defaultTracks,
      currentTrackIndex: 0,
      lastChecked: getServerTime(),
    };
    
    return fallbackState;
  }
}

// Point d'entrée GET pour récupérer l'état actuel de la radio
export async function GET(request: NextRequest) {
  try {
    console.log('[Radio] Début de la requête GET');
    
    // Vérifier si une mise à jour forcée est demandée
    const force = request.nextUrl.searchParams.get('force') === 'true';

    // Récupérer l'état depuis Redis
    let state = await getRadioState(force);

    // Si l'état n'existe toujours pas malgré nos efforts, créer un état minimal
    if (!state) {
      console.log('[Radio] Impossible de récupérer ou créer un état, retour d\'un état minimal');
      
      return NextResponse.json({
        currentTrack: defaultTracks[0],
        position: 0,
        isPlaying: true,
        nextTracks: [],
        remainingTime: 180,
        serverTime: new Date().toISOString(),
        status: "fallback_state"
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }

    // Calculer la position actuelle basée sur l'heure de début
    const now = getServerTime();
    const startTime = new Date(state.startTime);
    const elapsedSeconds = (now.getTime() - startTime.getTime()) / 1000;
    const position = Math.min(elapsedSeconds, state.currentTrack?.duration || 0);
    
    // Prévoir la liste des prochaines pistes
    const nextTracks = [];
    // Vérifier que tracks existe et a une longueur
    if (state.tracks && state.tracks.length > 0) {
      for (let i = 1; i <= 3; i++) {
        const nextIndex = (state.currentTrackIndex + i) % state.tracks.length;
        nextTracks.push(state.tracks[nextIndex]);
      }
    }
    
    // Calculer le temps restant pour la piste actuelle
    const remainingTime = (state.currentTrack?.duration || 0) - position;

    // Retourner les informations pertinentes au client
    return NextResponse.json({
      currentTrack: state.currentTrack,
      position,
      isPlaying: state.isPlaying,
      nextTracks,
      remainingTime,
      serverTime: now.toISOString(),
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('[Radio] Erreur dans la route GET:', error);
    
    // En cas d'erreur grave, retourner un état minimal de secours
    return NextResponse.json({
      currentTrack: defaultTracks[0],
      position: 0,
      isPlaying: true,
      nextTracks: [],
      remainingTime: 180,
      serverTime: new Date().toISOString(),
      status: "error_state"
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  }
}

// Point d'entrée POST pour créer/mettre à jour l'état de la radio
export async function POST(request: NextRequest) {
  try {
    console.log('[Radio] Début de la requête POST');
    
    // Récupérer les données du corps de la requête
    const data = await request.json();
    
    // Vérifier si c'est une demande de pause/reprise
    if (data.action === 'togglePlay') {
      const state = await getRadioState();
      
      if (!state) {
        return NextResponse.json({ error: "État radio non trouvé" }, { status: 404 });
      }
      
      // Inverser l'état de lecture
      state.isPlaying = !state.isPlaying;
      
      try {
        // Mettre à jour l'état dans Redis
        await redis.set(RADIO_STATE_KEY, state);
        console.log('[Radio] État de lecture mis à jour:', state.isPlaying ? 'En lecture' : 'En pause');
        
        // Retourner le nouvel état
        return NextResponse.json({
          isPlaying: state.isPlaying,
        });
      } catch (error) {
        console.error('[Radio] Erreur lors de la mise à jour de l\'état de lecture:', error);
        return NextResponse.json({ error: "Erreur lors de la mise à jour de l'état" }, { status: 500 });
      }
    }
    
    // Vérifier si c'est une demande de changement de piste
    if (data.action === 'nextTrack') {
      const state = await getRadioState();
      
      if (!state) {
        return NextResponse.json({ error: "État radio non trouvé" }, { status: 404 });
      }
      
      // Passer à la piste suivante
      const nextIndex = (state.currentTrackIndex + 1) % state.tracks.length;
      state.currentTrackIndex = nextIndex;
      state.currentTrack = state.tracks[nextIndex];
      state.position = 0;
      state.startTime = getServerTime();
      
      try {
        // Mettre à jour l'état dans Redis
        await redis.set(RADIO_STATE_KEY, state);
        console.log('[Radio] Passage à la piste suivante, index:', nextIndex);
        
        // Retourner un message de succès
        return NextResponse.json({
          success: true,
          currentTrack: state.currentTrack,
        });
      } catch (error) {
        console.error('[Radio] Erreur lors du changement de piste:', error);
        return NextResponse.json({ error: "Erreur lors du changement de piste" }, { status: 500 });
      }
    }
    
    // Si on arrive ici, c'est une demande de mise à jour complète de l'état
    if (!data.tracks || !Array.isArray(data.tracks) || data.tracks.length === 0) {
      return NextResponse.json({ error: "Données invalides, liste de pistes requise" }, { status: 400 });
    }
    
    // Créer un nouvel état
    const newState: RadioState = {
      currentTrack: data.tracks[0],
      position: 0,
      startTime: getServerTime(),
      isPlaying: true,
      tracks: data.tracks,
      currentTrackIndex: 0,
      lastChecked: getServerTime(),
    };
    
    try {
      // Enregistrer l'état dans Redis
      await redis.set(RADIO_STATE_KEY, newState);
      console.log('[Radio] Nouvel état radio créé avec', data.tracks.length, 'pistes');
      
      // Retourner un message de succès
      return NextResponse.json({
        success: true,
        message: "État radio créé avec succès",
      });
    } catch (error) {
      console.error('[Radio] Erreur lors de la création de l\'état:', error);
      return NextResponse.json({ error: "Erreur lors de la création de l'état" }, { status: 500 });
    }
  } catch (error) {
    console.error('[Radio] Erreur dans la route POST:', error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
} 