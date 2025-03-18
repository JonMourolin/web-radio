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
const END_TRACK_TOLERANCE = 10; // Augmenté à 10 secondes pour plus de marge

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
  const now = new Date();
  // Nous sommes en 2025, donc les dates sont correctes et ne nécessitent pas de correction
  return now;
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
    
    // Si force=true ou si la dernière vérification date d'il y a plus de 5 secondes
    // Augmenter le délai minimum entre les vérifications pour réduire les sauts
    if (force || new Date(lastTrackCheck).getTime() + 8000 < now.getTime()) {
      console.log('[Radio] Vérification de l\'avancement de la piste (dernier contrôle:', lastTrackCheck, ')');
      
      // Vérifier si la piste en cours est terminée en calculant la position actuelle
      const startTime = new Date(state.startTime);
      
      // Corriger les dates de démarrage de piste qui sont dans le futur
      if (startTime > now) {
        console.log(`[Radio] Date de démarrage dans le futur détectée: ${startTime.toISOString()} → date actuelle moins 10 secondes`);
        const correctedStartTime = new Date();
        correctedStartTime.setSeconds(correctedStartTime.getSeconds() - 10);
        state.startTime = correctedStartTime;
      }
      
      const elapsedSeconds = (now.getTime() - new Date(state.startTime).getTime()) / 1000;
      
      // Empêcher les valeurs négatives pour éviter des comportements bizarres
      const safeElapsedSeconds = Math.max(0, elapsedSeconds);
      
      // Mettre à jour la position dans l'état
      state.position = safeElapsedSeconds;
      state.lastChecked = now;
      
      // Vérifier si la piste est terminée et passer à la suivante si nécessaire
      const currentTrack = state.tracks[state.currentTrackIndex];
      
      // Augmenter la tolérance pour éviter les changements trop fréquents
      // et être moins agressif dans le calcul côté serveur, privilégier les notifications client
      if (currentTrack && safeElapsedSeconds >= (currentTrack.duration + END_TRACK_TOLERANCE)) {
        console.log(`Track ${currentTrack.title} might be finished after ${safeElapsedSeconds.toFixed(3)}s. Metadata duration was ${currentTrack.duration}s (with ${END_TRACK_TOLERANCE}s tolerance)`);
        
        // Pour les pistes longues, être plus prudent avec le changement automatique
        if (currentTrack.duration > 300) { // Plus de 5 minutes
          console.log('Long track detected. Being more conservative with auto-change.');
          
          // Pour les pistes longues, ajouter une tolérance supplémentaire de 5% de la durée
          const extraTolerance = currentTrack.duration * 0.05;
          
          if (safeElapsedSeconds < (currentTrack.duration + END_TRACK_TOLERANCE + extraTolerance)) {
            console.log(`Waiting for client notification on long track. Not changing automatically yet.`);
            return state;
          }
        }
        
        // Si on arrive ici, le serveur va changer de piste (en dernier recours)
        console.log(`Server is changing track automatically as fallback. Client notification preferred.`);
        
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
        }
      });
    }

    // S'assurer que l'état contient une piste actuelle
    if (!state.currentTrack && state.tracks && state.tracks.length > 0) {
      state.currentTrack = state.tracks[state.currentTrackIndex];
    }

    // Calculer le temps restant
    const currentTrack = state.currentTrack;
    const remainingTime = currentTrack 
      ? Math.max(0, currentTrack.duration - state.position)
      : 0;

    // Préparer les pistes suivantes (max 3)
    const nextTracks = [];
    if (state.tracks && state.tracks.length > 1) {
      for (let i = 1; i <= 3; i++) {
        const nextIndex = (state.currentTrackIndex + i) % state.tracks.length;
        nextTracks.push(state.tracks[nextIndex]);
      }
    }

    // Retourner l'état formaté pour le client
    const clientState = {
      currentTrack: state.currentTrack,
      position: parseFloat(state.position.toFixed(2)), // Arrondir pour éviter des décimales infinies
      isPlaying: state.isPlaying,
      nextTracks,
      remainingTime,
      serverTime: getServerTime().toISOString()
    };

    return NextResponse.json(clientState, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('[Radio] Erreur dans la route GET /api/stream:', error);
    
    return NextResponse.json({
      error: 'Erreur serveur',
      status: "error"
    }, { status: 500 });
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
    
    // Vérifier si c'est une notification de fin de piste venant du client
    if (data.action === 'trackEnded' && data.trackId) {
      console.log(`[Radio] Notification de fin de piste reçue du client pour: ${data.trackId}`);
      console.log(`[Radio] Durée réelle fournie: ${data.actualDuration || 'non spécifiée'}`);
      
      const state = await getRadioState();
      
      if (!state) {
        return NextResponse.json({ error: "État radio non trouvé" }, { status: 404 });
      }
      
      // Vérifier que le trackId correspond à la piste actuelle pour éviter les notifications obsolètes
      const currentTrack = state.tracks[state.currentTrackIndex];
      
      if (currentTrack && currentTrack.cloudinaryPublicId === data.trackId) {
        console.log('[Radio] Fin de piste confirmée par le client, passage à la piste suivante');
        
        // Vérifier que la piste actuelle est bien terminée en calculant le temps écoulé
        const now = getServerTime();
        const elapsedSeconds = (now.getTime() - new Date(state.startTime).getTime()) / 1000;
        const trackDuration = currentTrack.duration;
        
        // Ajout d'une vérification supplémentaire : la piste doit avoir joué au moins 80% de sa durée
        // pour éviter les changements prématurés
        if (elapsedSeconds < trackDuration * 0.8 && data.actualDuration && data.actualDuration < trackDuration * 0.8) {
          console.log(`[Radio] La piste n'a pas joué assez longtemps (${elapsedSeconds.toFixed(1)}s / ${trackDuration}s). Attente avant changement.`);
          return NextResponse.json({
            success: false,
            message: "La piste n'a pas joué assez longtemps, changement différé",
            currentTrack: currentTrack
          });
        }
        
        // Passer à la piste suivante
        const nextIndex = (state.currentTrackIndex + 1) % state.tracks.length;
        state.currentTrackIndex = nextIndex;
        state.currentTrack = state.tracks[nextIndex];
        state.position = 0;
        state.startTime = getServerTime();
        
        // Log détaillé du changement de piste
        console.log(`[Radio] Changement de piste: "${currentTrack.title}" → "${state.currentTrack.title}"`);
        console.log(`[Radio] Durée jouée: ${elapsedSeconds.toFixed(1)}s / ${trackDuration}s (${(elapsedSeconds/trackDuration*100).toFixed(0)}%)`);
        
        try {
          // Mettre à jour l'état dans Redis
          await redis.set(RADIO_STATE_KEY, state);
          console.log('[Radio] Passage à la piste suivante (notifié par client), index:', nextIndex);
          
          // Si une durée réelle a été fournie, la stocker pour les futures références
          if (data.actualDuration && currentTrack) {
            console.log(`[Radio] Durée réelle de piste: ${data.actualDuration}s (metadata: ${currentTrack.duration}s)`);
            // Ici on pourrait stocker cette information pour améliorer les métadonnées
          }
          
          // Rafraîchir le cache pour tous les clients
          revalidatePath('/api/stream');
          
          // Retourner un message de succès avec les informations sur la nouvelle piste
          return NextResponse.json({
            success: true,
            currentTrack: state.currentTrack,
            previousTrack: currentTrack.title,
            message: "Piste changée avec succès",
            playedDuration: elapsedSeconds,
            expectedDuration: trackDuration
          });
        } catch (error) {
          console.error('[Radio] Erreur lors du changement de piste:', error);
          return NextResponse.json({ error: "Erreur lors du changement de piste" }, { status: 500 });
        }
      } else {
        // Même si le trackId ne correspond pas, vérifier si la durée de la piste actuelle est dépassée
        // pour éviter les boucles infinies
        const now = getServerTime();
        const elapsedSeconds = (now.getTime() - new Date(state.startTime).getTime()) / 1000;
        
        if (currentTrack && elapsedSeconds > currentTrack.duration * 1.1) { // 110% de la durée prévue
          console.log(`[Radio] Piste actuelle a dépassé sa durée (${elapsedSeconds.toFixed(1)}s > ${currentTrack.duration}s), passage à la suivante malgré le trackId incorrect`);
          
          // Passer à la piste suivante
          const nextIndex = (state.currentTrackIndex + 1) % state.tracks.length;
          state.currentTrackIndex = nextIndex;
          state.currentTrack = state.tracks[nextIndex];
          state.position = 0;
          state.startTime = now;
          
          try {
            await redis.set(RADIO_STATE_KEY, state);
            revalidatePath('/api/stream');
            
            return NextResponse.json({
              success: true,
              currentTrack: state.currentTrack,
              message: "Piste changée (durée dépassée)",
              playedDuration: elapsedSeconds,
              expectedDuration: currentTrack.duration
            });
          } catch (error) {
            console.error('[Radio] Erreur lors du changement de piste forcé:', error);
          }
        }
        
        console.log('[Radio] Notification de fin de piste ignorée - trackId obsolète ou ne correspond pas à la piste actuelle');
        return NextResponse.json({
          success: false,
          message: "Notification de fin de piste ignorée - piste obsolète",
        });
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