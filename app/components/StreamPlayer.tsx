'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface StreamPlayerProps {
  serverUrl?: string;
}

interface TrackInfo {
  title: string;
  artist: string;
  album?: string;
  coverUrl: string;
  cloudinaryPublicId: string;
  duration: number;
}

interface StreamStatus {
  currentTrack: TrackInfo;
  nextTracks: TrackInfo[];
  listeners: number;
  isStreaming: boolean;
  uptime: number;
  trackPosition: number;
}

export default function StreamPlayer({ 
  serverUrl = '' // Nous n'utilisons plus cette prop
}: StreamPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [status, setStatus] = useState<StreamStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Formater le temps au format MM:SS
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Récupérer le statut du serveur de streaming
  const fetchStreamStatus = async () => {
    try {
      const response = await fetch(`/api/stream`);
      if (!response.ok) {
        throw new Error(`Erreur serveur: ${response.status}`);
      }
      
      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (error) {
      console.error('Erreur lors de la récupération du statut:', error);
      setError('Impossible de se connecter au service de streaming.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initialiser le lecteur et les mises à jour de statut
  useEffect(() => {
    // Créer l'élément audio s'il n'existe pas
    if (!audioRef.current && status?.currentTrack?.cloudinaryPublicId) {
      // Utiliser directement l'URL Cloudinary pour le streaming
      const cloudinaryUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload/${status.currentTrack.cloudinaryPublicId}`;
      const audio = new Audio(cloudinaryUrl);
      audio.preload = 'auto';
      audio.volume = volume;
      
      // Configurer les événements
      audio.addEventListener('playing', () => setIsPlaying(true));
      audio.addEventListener('pause', () => setIsPlaying(false));
      audio.addEventListener('error', (e) => {
        console.error('Erreur de lecture audio:', e);
        setError('Erreur de lecture du flux audio. Veuillez réessayer.');
        setIsPlaying(false);
      });
      
      // Mettre à la bonne position dans la piste
      if (status.trackPosition) {
        audio.currentTime = status.trackPosition;
      }
      
      audioRef.current = audio;
    }
    
    // Récupérer le statut initial
    fetchStreamStatus();
    
    // Configurer l'intervalle de mise à jour
    statusIntervalRef.current = setInterval(fetchStreamStatus, 10000);
    
    return () => {
      // Nettoyage
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [volume]);
  
  // Mettre à jour l'audio quand le status change
  useEffect(() => {
    if (status?.currentTrack?.cloudinaryPublicId && audioRef.current) {
      // Vérifier si la piste a changé
      if (audioRef.current.src.indexOf(status.currentTrack.cloudinaryPublicId) === -1) {
        // Charger la nouvelle piste
        const cloudinaryUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload/${status.currentTrack.cloudinaryPublicId}`;
        audioRef.current.src = cloudinaryUrl;
        audioRef.current.currentTime = status.trackPosition || 0;
        
        // Reprendre la lecture si elle était active
        if (isPlaying) {
          audioRef.current.play().catch(error => {
            console.error('Erreur de lecture:', error);
          });
        }
      } else if (Math.abs((audioRef.current.currentTime || 0) - (status.trackPosition || 0)) > 10) {
        // Si la différence est trop grande, synchroniser
        audioRef.current.currentTime = status.trackPosition || 0;
      }
    }
  }, [status, isPlaying]);
  
  // Gérer les changements de volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume;
    }
  }, [volume, muted]);
  
  // Bouton lecture/pause
  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(error => {
        console.error('Erreur de lecture:', error);
        setError('Impossible de démarrer la lecture. Veuillez réessayer.');
      });
    }
  };
  
  // Changer le volume
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };
  
  // Activer/désactiver le son
  const toggleMute = () => {
    setMuted(!muted);
  };
  
  // Calculer la progression de la piste
  const calculateProgress = () => {
    if (!status || !status.currentTrack) return 0;
    const progress = (status.trackPosition / status.currentTrack.duration) * 100;
    return Math.min(progress, 100);
  };
  
  // Afficher un message d'erreur
  if (error) {
    return (
      <div className="bg-black text-red-500 p-4 rounded-md">
        <h3 className="text-xl font-bold">Erreur de connexion</h3>
        <p>{error}</p>
        <button 
          onClick={() => {
            setError(null);
            setIsLoading(true);
            fetchStreamStatus();
            if (audioRef.current) {
              audioRef.current.load();
            }
          }}
          className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 transition-colors rounded-md"
        >
          Réessayer
        </button>
      </div>
    );
  }
  
  // Afficher un état de chargement
  if (isLoading) {
    return (
      <div className="bg-black text-[#00FF41] p-4 rounded-md animate-pulse">
        <p className="text-center">Connexion au serveur de streaming...</p>
      </div>
    );
  }
  
  return (
    <div className="bg-black text-[#00FF41] p-4 rounded-md w-full max-w-2xl mx-auto font-mono">
      {/* Section principale */}
      <div className="flex space-x-4">
        {/* Couverture */}
        <div className="relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0">
          {status?.currentTrack?.coverUrl ? (
            <Image
              src={status.currentTrack.coverUrl}
              alt={`${status.currentTrack.artist} - ${status.currentTrack.title}`}
              fill
              className="rounded-md object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center rounded-md">
              <span className="text-2xl">🎵</span>
            </div>
          )}
        </div>
        
        {/* Informations de piste */}
        <div className="flex-1">
          <h3 className="text-xl font-bold truncate">{status?.currentTrack?.title || 'Aucune piste'}</h3>
          <p className="text-sm opacity-70 truncate">{status?.currentTrack?.artist || 'Artiste inconnu'}</p>
          
          {/* Progression */}
          <div className="mt-4">
            <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="absolute left-0 top-0 h-full bg-[#00FF41]"
                style={{ width: `${calculateProgress()}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span>{formatTime(status?.trackPosition || 0)}</span>
              <span>{formatTime(status?.currentTrack?.duration || 0)}</span>
            </div>
          </div>
          
          {/* Contrôles */}
          <div className="flex items-center space-x-4 mt-4">
            <button onClick={togglePlay} className="text-2xl">
              {isPlaying ? (
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="#00FF41">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="#00FF41">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            
            <button onClick={toggleMute} className="text-xl">
              {muted ? '🔇' : '🔊'}
            </button>
            
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-24 h-2 rounded-full bg-white/10 appearance-none"
            />
            
            <div className="text-xs ml-auto">
              <span>{status?.listeners || 0} 👂</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* À venir */}
      {status?.nextTracks && status.nextTracks.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-bold mb-2">À venir:</h4>
          <div className="space-y-2">
            {status.nextTracks.slice(0, 3).map((track, index) => (
              <div key={track.cloudinaryPublicId} className="flex items-center space-x-2 text-xs">
                <span className="opacity-70">{index + 1}.</span>
                <div className="relative w-6 h-6 rounded-md overflow-hidden">
                  {track.coverUrl ? (
                    <Image
                      src={track.coverUrl}
                      alt={track.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-800"></div>
                  )}
                </div>
                <span className="font-medium truncate">{track.title}</span>
                <span className="opacity-70 truncate">{track.artist}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Informations serveur */}
      <div className="mt-6 text-xs grid grid-cols-2 gap-2 border-t border-[#00FF41]/20 pt-2">
        <div>Status: {status?.isStreaming ? '✅ En ligne' : '❌ Hors ligne'}</div>
        <div>Uptime: {formatTime(status?.uptime || 0)}</div>
      </div>
    </div>
  );
} 