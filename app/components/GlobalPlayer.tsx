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
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const audioInitializedRef = useRef(false);
  
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
      const trackChanged = newTrackId !== lastTrackId;
      
      if (trackChanged && newTrackId) {
        console.log('Track changed from', lastTrackId, 'to', newTrackId);
        setLastTrackId(newTrackId);
        
        // Seulement si la piste a changé, on met à jour l'audio
        if (audioRef.current) {
          const wasPlaying = !audioRef.current.paused && !localPause;
          console.log('Loading new track URL:', data.currentTrack.cloudinaryUrl);
          console.log('Setting position to:', data.position);
          
          audioRef.current.src = data.currentTrack.cloudinaryUrl;
          audioRef.current.currentTime = data.position;
          audioRef.current.volume = volume;
          
          if (wasPlaying) {
            console.log('Resuming playback of new track');
            audioRef.current.play().catch(console.error);
          }
        }
      } else if (lastTrackId === null && newTrackId) {
        // Premier chargement
        console.log('Initial track load:', newTrackId);
        setLastTrackId(newTrackId);
        
        // Initialiser l'audio avec la piste actuelle
        if (audioRef.current && data.currentTrack.cloudinaryUrl && !audioInitializedRef.current) {
          console.log('Initializing audio with URL:', data.currentTrack.cloudinaryUrl);
          console.log('Initial position:', data.position);
          
          audioRef.current.src = data.currentTrack.cloudinaryUrl;
          audioRef.current.currentTime = data.position;
          audioRef.current.volume = volume;
          audioInitializedRef.current = true;
          
          // Si la radio est en lecture, démarrer l'audio
          if (data.isPlaying && !localPause) {
            console.log('Starting initial playback');
            audioRef.current.play().catch(console.error);
          }
        }
      } else {
        // Même piste, on ajuste juste la position si nécessaire
        if (audioRef.current && Math.abs(audioRef.current.currentTime - data.position) > 5) {
          // Seulement si le décalage est important (> 5 secondes)
          console.log('Adjusting position from', audioRef.current.currentTime, 'to', data.position);
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
    
    // Set up polling interval (every 5 seconds instead of 10)
    pollingRef.current = setInterval(fetchRadioState, 5000);
    
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

  // Handle volume change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Handle track end
  const handleTrackEnd = () => {
    // Quand une piste se termine, on force une mise à jour immédiate
    fetchRadioState();
  };

  // Créer l'élément audio une seule fois
  useEffect(() => {
    if (!audioRef.current && typeof Audio !== 'undefined') {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;
      audioRef.current.onended = handleTrackEnd;
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current.onended = null;
        audioRef.current = null;
      }
    };
  }, []);

  // Exposer l'état et les fonctions au contexte global (window)
  useEffect(() => {
    // Exposer l'état et les contrôles au window pour permettre aux autres composants d'y accéder
    // @ts-ignore
    window.radioPlayer = {
      isPlaying,
      currentTrack,
      volume,
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
      setVolume: (newVolume: number) => {
        setVolume(newVolume);
        if (audioRef.current) {
          audioRef.current.volume = newVolume;
        }
      },
      // Ajouter une fonction de diagnostic pour inspecter et réparer l'état
      diagnose: async () => {
        console.log('--- Diagnostic Radio State ---');
        console.log('Current Track ID:', lastTrackId);
        console.log('Current Track:', currentTrack);
        console.log('Is Playing:', isPlaying);
        console.log('Local Pause:', localPause);
        
        if (audioRef.current) {
          console.log('Audio Current Time:', audioRef.current.currentTime);
          console.log('Audio Duration:', audioRef.current.duration);
          console.log('Audio Paused:', audioRef.current.paused);
          console.log('Audio Source:', audioRef.current.src);
        } else {
          console.log('Audio element not initialized');
        }
        
        // Forcer une mise à jour immédiate de l'état
        console.log('Forcing state update...');
        const response = await fetch('/api/stream?force=true');
        const data = await response.json();
        console.log('Server Response:', data);
        
        return "Diagnostic completed. Check console for details.";
      },
      // Ajouter une fonction pour forcer le passage à la piste suivante
      nextTrack: async () => {
        console.log('Forcing next track...');
        try {
          const response = await fetch('/api/stream', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action: 'nextTrack' })
          });
          
          if (!response.ok) {
            throw new Error('Failed to change track');
          }
          
          console.log('Track change requested, refreshing state...');
          fetchRadioState();
          return "Track change requested.";
        } catch (error) {
          console.error('Error changing track:', error);
          return "Error changing track. See console.";
        }
      }
    };

    return () => {
      // @ts-ignore
      delete window.radioPlayer;
    };
  }, [isPlaying, currentTrack, volume, lastTrackId, localPause]);

  return null; // Pas de rendu visible nécessaire
} 