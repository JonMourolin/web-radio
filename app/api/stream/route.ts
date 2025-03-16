import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Singleton pour maintenir l'état global de la radio
class RadioState {
  private static instance: RadioState;
  private currentTrackIndex: number = 0;
  private playlist: any[] = [];
  private startTime: number = Date.now();
  private trackStartTime: number = Date.now();
  private isPlaying: boolean = true;
  private defaultTrackDuration: number = 180; // 3 minutes par défaut en secondes

  private constructor() {
    // Initialiser la playlist vide
    this.refreshPlaylist();
    
    // Rafraîchir la playlist toutes les 6 heures
    setInterval(() => this.refreshPlaylist(), 6 * 60 * 60 * 1000);
    
    // Vérifier et passer à la piste suivante si nécessaire
    setInterval(() => this.checkAndAdvanceTrack(), 10000); // Vérifier toutes les 10 secondes
  }

  public static getInstance(): RadioState {
    if (!RadioState.instance) {
      RadioState.instance = new RadioState();
    }
    return RadioState.instance;
  }

  private async refreshPlaylist() {
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
            duration = this.defaultTrackDuration;
          }
        } else {
          duration = this.defaultTrackDuration;
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

      // Mélanger la playlist seulement si elle est vide ou a changé significativement
      if (this.playlist.length === 0) {
        this.playlist = this.shuffleArray(tracks);
        this.currentTrackIndex = 0;
        this.trackStartTime = Date.now();
      } else {
        // Préserver la piste actuelle et sa position
        const currentTrack = this.playlist[this.currentTrackIndex];
        this.playlist = this.shuffleArray(tracks);
        
        // Essayer de trouver la piste actuelle dans la nouvelle playlist
        const newIndex = this.playlist.findIndex(
          track => track.cloudinaryPublicId === currentTrack.cloudinaryPublicId
        );
        
        if (newIndex >= 0) {
          this.currentTrackIndex = newIndex;
        } else {
          this.currentTrackIndex = 0;
          this.trackStartTime = Date.now();
        }
      }
    } catch (error) {
      console.error('Error refreshing playlist:', error);
    }
  }

  private shuffleArray(array: any[]) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private checkAndAdvanceTrack() {
    if (this.playlist.length === 0) return;
    
    const currentTrack = this.playlist[this.currentTrackIndex];
    if (!currentTrack) return;
    
    // Utiliser la durée de la piste ou la durée par défaut
    const trackDuration = (currentTrack.duration || this.defaultTrackDuration) * 1000; // Convertir en millisecondes
    const elapsedTime = Date.now() - this.trackStartTime;
    
    // Si la piste actuelle est terminée, passer à la suivante
    if (elapsedTime >= trackDuration) {
      console.log(`Track ${currentTrack.title} finished after ${elapsedTime/1000}s. Duration was ${trackDuration/1000}s`);
      this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
      this.trackStartTime = Date.now();
      console.log(`Now playing: ${this.playlist[this.currentTrackIndex].title}`);
    }
  }

  public getCurrentTrack() {
    if (this.playlist.length === 0) return null;
    return this.playlist[this.currentTrackIndex];
  }

  public getPlaybackInfo() {
    if (this.playlist.length === 0) return { currentTrack: null, position: 0, isPlaying: false, nextTracks: [] };
    
    const currentTrack = this.playlist[this.currentTrackIndex];
    const elapsedTime = Date.now() - this.trackStartTime;
    const trackDuration = (currentTrack.duration || this.defaultTrackDuration) * 1000;
    const position = Math.min(elapsedTime / 1000, currentTrack.duration || this.defaultTrackDuration); // En secondes
    
    return {
      currentTrack,
      position,
      isPlaying: this.isPlaying,
      nextTracks: this.getNextTracks(3),
      remainingTime: Math.max(0, (trackDuration - elapsedTime) / 1000) // Temps restant en secondes
    };
  }

  private getNextTracks(count: number) {
    if (this.playlist.length === 0) return [];
    
    const nextTracks = [];
    for (let i = 1; i <= count; i++) {
      const index = (this.currentTrackIndex + i) % this.playlist.length;
      nextTracks.push(this.playlist[index]);
    }
    
    return nextTracks;
  }
}

export async function GET() {
  try {
    const radioState = RadioState.getInstance();
    const playbackInfo = radioState.getPlaybackInfo();
    
    return NextResponse.json(playbackInfo);
  } catch (error) {
    console.error('Error getting radio state:', error);
    return NextResponse.json(
      { error: 'Failed to get radio state' },
      { status: 500 }
    );
  }
} 