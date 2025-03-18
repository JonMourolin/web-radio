'use client';

import { useState, useRef, useEffect } from 'react';
import { Track } from '@/app/types/track';

// Créer un contexte global pour le player audio
// Ce composant est destiné à être inclus une seule fois dans le layout principal
// pour assurer la persistance de l'audio lors des navigations

interface RadioState {
  currentTrack: Track | null;
  position: number;
  isPlaying: boolean;
  nextTracks: Track[];
  remainingTime: number;
}

export default function GlobalPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [radioState, setRadioState] = useState<RadioState | null>(null);
  const [lastTrackId, setLastTrackId] = useState<string | null>(null);
  const [localPause, setLocalPause] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get current track from radio state
  const currentTrack = radioState?.currentTrack || null;

  // Fetch radio state from server
  const fetchRadioState = async () => {
    try {
      const response = await fetch('/api/stream');
      if (!response.ok) throw new Error('Failed to fetch radio state');
      const data = await response.json();
      
      // Si aucune piste n'est disponible, on arrête ici
      if (data.status === "no_tracks" || !data.currentTrack) {
        setRadioState(data);
        return;
      }
      
      // Vérifier si la piste a changé
      const newTrackId = data.currentTrack?.cloudinaryPublicId;
      const trackChanged = newTrackId !== lastTrackId && lastTrackId !== null;
      
      if (trackChanged && newTrackId) {
        console.log('Track changed, loading new track');
        setLastTrackId(newTrackId);
        
        // Seulement si la piste a changé, on met à jour l'audio
        if (audioRef.current) {
          const wasPlaying = !audioRef.current.paused && !localPause;
          audioRef.current.src = data.currentTrack.cloudinaryUrl;
          audioRef.current.currentTime = data.position;
          
          if (wasPlaying) {
            audioRef.current.play().catch(console.error);
          }
        }
      } else if (lastTrackId === null && newTrackId) {
        // Premier chargement
        setLastTrackId(newTrackId);
        
        // Initialiser l'audio avec la piste actuelle
        if (audioRef.current && data.currentTrack.cloudinaryUrl) {
          audioRef.current.src = data.currentTrack.cloudinaryUrl;
          audioRef.current.currentTime = data.position;
          
          // Si la radio est en lecture, démarrer l'audio
          if (data.isPlaying && !localPause) {
            audioRef.current.play().catch(console.error);
          }
        }
      } else {
        // Même piste, on ajuste juste la position si nécessaire
        if (audioRef.current && Math.abs(audioRef.current.currentTime - data.position) > 5) {
          // Seulement si le décalage est important (> 5 secondes)
          audioRef.current.currentTime = data.position;
        }
      }
      
      setRadioState(data);
      
      // Ne pas modifier l'état de lecture si l'utilisateur a mis en pause manuellement
      if (!localPause) {
        setIsPlaying(data.isPlaying);
      }
    } catch (error) {
      console.error('Error fetching radio state:', error);
    }
  };

  // Initialize and periodically update radio state
  useEffect(() => {
    // Initial fetch
    fetchRadioState();
    
    // Set up polling interval (every 10 seconds)
    pollingRef.current = setInterval(fetchRadioState, 10000);
    
    // Clean up on unmount
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Effect to handle audio playback when radio state changes
  useEffect(() => {
    if (!audioRef.current || !radioState || !currentTrack) return;
    
    // Play or pause based on radio state and local pause state
    if (isPlaying && !localPause && audioRef.current.paused) {
      audioRef.current.play().catch(console.error);
    } else if ((!isPlaying || localPause) && !audioRef.current.paused) {
      audioRef.current.pause();
    }
  }, [radioState, currentTrack, isPlaying, localPause]);

  // Handle track end
  const handleTrackEnd = () => {
    // Quand une piste se termine, on force une mise à jour immédiate
    fetchRadioState();
  };

  // Exposer l'état et les fonctions au contexte global (window)
  useEffect(() => {
    // Exposer l'état et les contrôles au window pour permettre aux autres composants d'y accéder
    // @ts-ignore
    window.radioPlayer = {
      isPlaying,
      currentTrack,
      togglePlay: () => {
        if (audioRef.current) {
          if (isPlaying) {
            audioRef.current.pause();
            setLocalPause(true);
          } else {
            audioRef.current.play().catch(console.error);
            setLocalPause(false);
          }
          setIsPlaying(!isPlaying);
        }
      },
      setVolume: (volume: number) => {
        if (audioRef.current) {
          audioRef.current.volume = volume;
        }
      }
    };

    return () => {
      // @ts-ignore
      delete window.radioPlayer;
    };
  }, [isPlaying, currentTrack]);

  return (
    <>
      {currentTrack?.cloudinaryUrl && (
        <audio
          ref={audioRef}
          src={currentTrack.cloudinaryUrl}
          onEnded={handleTrackEnd}
          hidden
          preload="auto"
        />
      )}
    </>
  );
} 