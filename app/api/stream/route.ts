import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { Redis } from '@upstash/redis';

// Configuration explicite des informations Redis
const redisUrl = process.env.KV_REST_API_URL || '';
const redisToken = process.env.KV_REST_API_TOKEN || '';

// Afficher les informations de connexion (versions masquées) pour le débogage
console.log(`Redis URL: ${redisUrl ? 'Définie' : 'Non définie'}`);
console.log(`Redis Token: ${redisToken ? 'Défini' : 'Non défini'}`);

// Configurer Redis/KV
let kv: any;
try {
  // Utiliser une configuration directe au lieu de fromEnv()
  kv = new Redis({
    url: redisUrl,
    token: redisToken
  });
  console.log('Upstash Redis initialisé avec succès avec configuration directe');
} catch (error) {
  console.warn('Upstash Redis module not available, using in-memory storage', error);
  // Implémentation en mémoire pour le développement local
  kv = {
    _storage: new Map(),
    async get(key: string) {
      return this._storage.get(key);
    },
    async set(key: string, value: any) {
      this._storage.set(key, value);
      return 'OK';
    }
  };
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Clés pour le stockage Redis
const RADIO_STATE_KEY = 'radio:state:v2';
const LAST_CHECK_KEY = 'radio:lastCheck:v2';
const REFRESH_KEY = 'radio:lastRefresh:v2';

// Interface pour typer l'état de la radio
interface RadioStateData {
  currentTrackIndex: number;
  playlist: any[];
  trackStartTime: number;
  isPlaying: boolean;
  defaultTrackDuration: number;
}

// Récupère l'état actuel de la radio depuis le stockage KV
async function getRadioState(): Promise<RadioStateData> {
  try {
    // Tenter de récupérer l'état
    console.log(`[Radio] Récupération de l'état radio depuis la clé ${RADIO_STATE_KEY}`);
    const state = await kv.get(RADIO_STATE_KEY);
    console.log(`[Radio] État récupéré:`, state ? 'Trouvé' : 'Non trouvé');
    
    // Si l'état n'existe pas, retourner un état par défaut
    if (!state) {
      console.log('[Radio] Aucun état trouvé, création d\'un état par défaut');
      const defaultState: RadioStateData = {
        currentTrackIndex: 0,
        playlist: [],
        trackStartTime: Date.now(),
        isPlaying: true,
        defaultTrackDuration: 180
      };
      
      // Initialiser la playlist
      console.log('[Radio] Initialisation d\'une nouvelle playlist');
      await refreshPlaylist(defaultState);
      
      // Sauvegarder et retourner l'état par défaut
      console.log('[Radio] Sauvegarde de l\'état par défaut');
      await kv.set(RADIO_STATE_KEY, defaultState);
      return defaultState;
    }
    
    return state;
  } catch (error) {
    console.error('[Radio] Erreur lors de la récupération de l\'état:', error);
    
    // En cas d'erreur, retourner un état vide mais fonctionnel
    return {
      currentTrackIndex: 0,
      playlist: [],
      trackStartTime: Date.now(),
      isPlaying: true,
      defaultTrackDuration: 180
    };
  }
}

// Met à jour l'état de la radio dans le stockage KV
async function updateRadioState(state: RadioStateData): Promise<void> {
  try {
    console.log(`[Radio] Mise à jour de l'état radio: piste actuelle ${state.currentTrackIndex}, démarrée à ${new Date(state.trackStartTime).toISOString()}`);
    await kv.set(RADIO_STATE_KEY, state);
    console.log('[Radio] État mis à jour avec succès');
  } catch (error) {
    console.error('[Radio] Erreur lors de la mise à jour de l\'état:', error);
  }
}

// Rafraîchit la playlist depuis Cloudinary
async function refreshPlaylist(state: RadioStateData): Promise<void> {
  try {
    // Récupérer toutes les pistes depuis Cloudinary
    const result = await cloudinary.search
      .expression('folder:web-radio/tracks/*')
      .with_field('context')
      .execute();

    // Transformer les résultats en playlist
    const tracks = result.resources.map((resource: any) => {
      const context = resource.context || {};
      
      // S'assurer que la durée est un nombre valide
      let duration = 0;
      if (context.duration) {
        duration = parseInt(context.duration);
        if (isNaN(duration) || duration <= 0) {
          duration = state.defaultTrackDuration;
        }
      } else {
        duration = state.defaultTrackDuration;
      }
      
      return {
        filename: resource.filename,
        title: context.title || resource.filename.split('.')[0],
        artist: context.artist || 'Unknown Artist',
        album: context.album || 'Unknown Album',
        duration: duration,
        coverUrl: context.coverUrl || '',
        cloudinaryUrl: resource.secure_url,
        cloudinaryPublicId: resource.public_id,
      };
    });

    // Si la playlist est vide, initialiser avec les nouvelles pistes
    if (state.playlist.length === 0) {
      state.playlist = shuffleArray(tracks);
      state.currentTrackIndex = 0;
      state.trackStartTime = Date.now();
      console.log('Playlist initialisée avec', state.playlist.length, 'pistes');
      // Sauvegarder l'état mis à jour
      await updateRadioState(state);
      return;
    }
    
    // Sinon, préserver la piste actuelle et sa position
    const currentTrack = state.playlist[state.currentTrackIndex];
    
    // Mettre à jour la playlist en préservant l'ordre actuel
    state.playlist = shuffleArray(tracks);
    
    // Essayer de trouver la piste actuelle dans la nouvelle playlist
    const newIndex = state.playlist.findIndex(
      track => track.cloudinaryPublicId === currentTrack.cloudinaryPublicId
    );
    
    if (newIndex >= 0) {
      // Garder la même piste et la même position
      state.currentTrackIndex = newIndex;
    } else {
      // Si la piste n'existe plus, commencer une nouvelle
      state.currentTrackIndex = 0;
      state.trackStartTime = Date.now();
    }
    
    // Sauvegarder l'état mis à jour
    await updateRadioState(state);
    console.log('Playlist rafraîchie avec', state.playlist.length, 'pistes');
  } catch (error) {
    console.error('Error refreshing playlist:', error);
  }
}

// Fonction utilitaire pour mélanger un tableau
function shuffleArray(array: any[]) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Vérifie et passe à la piste suivante si nécessaire
async function checkAndAdvanceTrack(state: RadioStateData): Promise<boolean> {
  try {
    // Éviter les vérifications trop fréquentes
    const now = Date.now();
    const lastCheck = await kv.get(LAST_CHECK_KEY) || 0;
    
    if (now - lastCheck < 2000) {
      return false;
    }
    
    // Mettre à jour le timestamp de dernière vérification
    await kv.set(LAST_CHECK_KEY, now);
    
    if (state.playlist.length === 0) return false;
    
    const currentTrack = state.playlist[state.currentTrackIndex];
    if (!currentTrack) return false;
    
    // Utiliser la durée de la piste ou la durée par défaut
    const trackDuration = (currentTrack.duration || state.defaultTrackDuration) * 1000; // Convertir en millisecondes
    const elapsedTime = now - state.trackStartTime;
    
    // Si la piste actuelle est terminée, passer à la suivante
    if (elapsedTime >= trackDuration) {
      console.log(`Track ${currentTrack.title} finished after ${elapsedTime/1000}s. Duration was ${trackDuration/1000}s`);
      state.currentTrackIndex = (state.currentTrackIndex + 1) % state.playlist.length;
      state.trackStartTime = now;
      
      const nextTrack = state.playlist[state.currentTrackIndex];
      console.log(`Now playing: ${nextTrack.title} by ${nextTrack.artist}`);
      
      // Sauvegarder l'état mis à jour
      await updateRadioState(state);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking and advancing track:', error);
    return false;
  }
}

// Récupère les informations de lecture
function getPlaybackInfo(state: RadioStateData) {
  if (state.playlist.length === 0) {
    return { 
      currentTrack: null, 
      position: 0, 
      isPlaying: false, 
      nextTracks: [],
      remainingTime: 0
    };
  }
  
  const currentTrack = state.playlist[state.currentTrackIndex];
  const elapsedTime = Date.now() - state.trackStartTime;
  const trackDuration = (currentTrack.duration || state.defaultTrackDuration) * 1000;
  const position = Math.min(elapsedTime / 1000, currentTrack.duration || state.defaultTrackDuration); // En secondes
  
  return {
    currentTrack,
    position,
    isPlaying: state.isPlaying,
    nextTracks: getNextTracks(state, 3),
    remainingTime: Math.max(0, (trackDuration - elapsedTime) / 1000), // Temps restant en secondes
    trackStartTime: state.trackStartTime // Ajouter le timestamp de début pour une meilleure synchronisation
  };
}

// Récupère les prochaines pistes
function getNextTracks(state: RadioStateData, count: number) {
  if (state.playlist.length === 0) return [];
  
  const nextTracks = [];
  for (let i = 1; i <= count; i++) {
    const index = (state.currentTrackIndex + i) % state.playlist.length;
    nextTracks.push(state.playlist[index]);
  }
  
  return nextTracks;
}

// Planifier le rafraîchissement périodique de la playlist
// Nous ne pouvons pas utiliser setInterval dans les fonctions serverless,
// nous implémenterons cette logique dans la fonction GET
const REFRESH_INTERVAL = 6 * 60 * 60 * 1000; // 6 heures en millisecondes

export async function GET() {
  try {
    console.log('[Radio] Début de la requête GET');
    
    // Récupérer l'état actuel
    const state = await getRadioState();
    console.log(`[Radio] État récupéré: ${state.playlist.length} pistes, piste actuelle: ${state.currentTrackIndex}`);
    
    // Vérifier si nous devons rafraîchir la playlist (toutes les 6 heures)
    const now = Date.now();
    const lastRefresh = await kv.get(REFRESH_KEY) || 0;
    
    if (now - lastRefresh > REFRESH_INTERVAL) {
      console.log('Rafraîchissement périodique de la playlist...');
      await refreshPlaylist(state);
      await kv.set(REFRESH_KEY, now);
    }
    
    // Vérifier et avancer la piste si nécessaire, mais uniquement
    // si le client fait une requête complète (non-revalidation)
    // et pas à chaque rafraîchissement de page
    const lastCheckTime = await kv.get(LAST_CHECK_KEY) || 0;
    const MIN_CHECK_INTERVAL = 5000; // 5 secondes entre les vérifications
    
    if (now - lastCheckTime > MIN_CHECK_INTERVAL) {
      console.log(`[Radio] Vérification de l'avancement de la piste (dernier contrôle: ${new Date(lastCheckTime).toISOString()})`);
      await checkAndAdvanceTrack(state);
      await kv.set(LAST_CHECK_KEY, now);
    } else {
      console.log(`[Radio] Vérification ignorée - trop récente (dernier contrôle: ${new Date(lastCheckTime).toISOString()})`);
    }
    
    // Récupérer les informations de lecture
    const playbackInfo = getPlaybackInfo(state);
    
    // Ajouter les en-têtes pour éviter la mise en cache du navigateur
    return new NextResponse(JSON.stringify(playbackInfo), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error in GET route:', error);
    return NextResponse.json(
      { error: 'Failed to get radio state' },
      { status: 500 }
    );
  }
} 