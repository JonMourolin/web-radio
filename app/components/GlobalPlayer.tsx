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
  const lastPositionUpdateRef = useRef<number>(0);
  const isAdjustingPositionRef = useRef<boolean>(false);
  const lastSyncTimeRef = useRef<number>(Date.now());
  
  // Get current track from radio state
  const currentTrack = radioState?.currentTrack || null;

  // Fetch radio state from server
  const fetchRadioState = async () => {
    try {
      // Éviter les mises à jour trop fréquentes
      const now = Date.now();
      if (now - lastSyncTimeRef.current < 4000) {
        return; // Ne pas mettre à jour si la dernière mise à jour date de moins de 4 secondes
      }
      lastSyncTimeRef.current = now;
      
      // Sauvegarder l'URL actuelle pour comparaison
      const currentUrl = audioRef.current?.src || '';
      
      const response = await fetch('/api/stream');
      if (!response.ok) throw new Error('Failed to fetch radio state');
      const data = await response.json();
      
      // Si aucune piste n'est disponible, on arrête ici
      if (data.status === "no_tracks" || !data.currentTrack) {
        setRadioState(data);
        return;
      }
      
      // Vérifier si la piste a changé en comparant l'URL complète
      const newTrackId = data.currentTrack?.cloudinaryPublicId;
      const newTrackUrl = data.currentTrack?.cloudinaryUrl || '';
      
      // Empêcher les faux changements de piste lors des rechargements rapides
      const trackReallyChanged = newTrackUrl && currentUrl && newTrackUrl !== currentUrl && newTrackId !== lastTrackId;
      
      if (trackReallyChanged || (lastTrackId === null && newTrackId)) {
        // Cas 1: La piste a vraiment changé OU Cas 2: Premier chargement
        const isFirstLoad = lastTrackId === null;
        
        if (!isFirstLoad) {
          console.log('Track REALLY changed from', lastTrackId, 'to', newTrackId);
        } else {
          console.log('Initial track load:', newTrackId);
        }
        
        // Toujours mettre à jour l'ID de la dernière piste
        setLastTrackId(newTrackId);
        
        if (audioRef.current && newTrackUrl) {
          const wasPlaying = !audioRef.current.paused && !localPause;
          
          if (!isFirstLoad) {
            console.log('Loading new track URL:', newTrackUrl);
          } else {
            console.log('Initializing audio with URL:', newTrackUrl);
          }
          console.log('Setting position to:', data.position);
          
          // Étape 1: Marquer que nous sommes en train d'ajuster l'audio pour éviter les callbacks en boucle
          isAdjustingPositionRef.current = true;
          
          // Étape 2: Définir une fonction qui sera utilisée après le chargement des métadonnées
          const handleAudioLoaded = () => {
            try {
              // Étape 3: Définir la position une fois les métadonnées chargées
              if (audioRef.current) {
                audioRef.current.currentTime = data.position;
                lastPositionUpdateRef.current = data.position;
                
                // Étape 4: Reprendre la lecture avec un délai pour stabiliser
                if ((wasPlaying || data.isPlaying) && !localPause) {
                  setTimeout(() => {
                    if (audioRef.current) {
                      console.log('Resuming playback after metadata loaded, position:', audioRef.current.currentTime);
                      audioRef.current.play().catch(err => {
                        console.error('Failed to play audio:', err);
                      });
                    }
                    isAdjustingPositionRef.current = false;
                  }, 500); // Délai plus long de 500ms
                } else {
                  isAdjustingPositionRef.current = false;
                }
                
                if (isFirstLoad) {
                  audioInitializedRef.current = true;
                }
              }
            } catch (err) {
              console.error('Error setting position:', err);
              isAdjustingPositionRef.current = false;
            }
          };
          
          // Étape 5: Configurer la source audio et attacher l'événement
          // Important: pause avant de changer la source pour éviter des lectures automatiques
          audioRef.current.pause();
          
          // Vérifier si l'URL est réellement différente avant de la changer
          if (audioRef.current.src !== newTrackUrl) {
            audioRef.current.src = newTrackUrl;
            
            // N'attacher l'événement que si nous devons charger une nouvelle URL
            if (audioRef.current.readyState >= 2) {
              handleAudioLoaded();
            } else {
              audioRef.current.addEventListener('loadedmetadata', handleAudioLoaded, { once: true });
            }
          } else {
            // Même URL mais mise à jour de position nécessaire
            handleAudioLoaded();
          }
        }
      } else if (newTrackId === lastTrackId) {
        // Même piste, on ajuste juste la position si nécessaire et si on n'est pas déjà en train d'ajuster
        if (
          audioRef.current && 
          !isAdjustingPositionRef.current && 
          Math.abs(audioRef.current.currentTime - data.position) > 15 && // Seuil encore plus élevé (15 secondes)
          now - lastPositionUpdateRef.current > 20000 // Au moins 20 secondes entre les ajustements
        ) {
          console.log('Significant drift detected. Adjusting position from', audioRef.current.currentTime, 'to', data.position);
          isAdjustingPositionRef.current = true;
          
          // Attendre que l'audio soit dans un état stable
          setTimeout(() => {
            try {
              if (audioRef.current) {
                audioRef.current.currentTime = data.position;
                lastPositionUpdateRef.current = now;
              }
            } catch (err) {
              console.error('Error adjusting position:', err);
            } finally {
              isAdjustingPositionRef.current = false;
            }
          }, 300);
        }
      }
      
      // Toujours mettre à jour l'état de la radio
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
    // Initial fetch with a longer delay to allow the audio element to initialize
    setTimeout(fetchRadioState, 1000);
    
    // Set up polling interval with increased delay (10 secondes)
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
    if (isPlaying && !localPause && audioRef.current.paused && !isAdjustingPositionRef.current) {
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
    console.log('Track ended naturally, requesting next track');
    // Attendre un peu avant de recharger l'état pour éviter les conflits
    setTimeout(fetchRadioState, 500);
  };

  // Créer l'élément audio une seule fois
  useEffect(() => {
    if (!audioRef.current && typeof Audio !== 'undefined') {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;
      audioRef.current.onended = handleTrackEnd;
      
      // Ajouter des gestionnaires pour surveiller les erreurs et sauts
      audioRef.current.onerror = (e) => {
        console.error('Audio playback error:', e);
      };
      
      audioRef.current.onstalled = () => {
        console.warn('Audio playback stalled');
      };
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        audioRef.current.onstalled = null;
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