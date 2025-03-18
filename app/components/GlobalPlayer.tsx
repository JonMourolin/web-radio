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
      if (now - lastSyncTimeRef.current < 5000) {
        return; // Ne pas mettre à jour si la dernière mise à jour date de moins de 5 secondes
      }
      
      // Si nous sommes en train d'ajuster une position, ignorer cette mise à jour
      if (isAdjustingPositionRef.current) {
        console.log('Skipping state update because position is being adjusted');
        return;
      }
      
      lastSyncTimeRef.current = now;
      
      const response = await fetch('/api/stream');
      if (!response.ok) throw new Error('Failed to fetch radio state');
      const data = await response.json();
      
      // Si aucune piste n'est disponible, on arrête ici
      if (data.status === "no_tracks" || !data.currentTrack) {
        setRadioState(data);
        return;
      }
      
      // Mettre à jour l'état d'abord
      setRadioState(data);
      
      const newTrackId = data.currentTrack?.cloudinaryPublicId;
      const newTrackUrl = data.currentTrack?.cloudinaryUrl;
      
      // Si l'audio n'est pas encore initialisé, ou si nous n'avons pas d'ID de piste, initialiser
      if (!audioRef.current || !newTrackId || !newTrackUrl) {
        return;
      }
      
      // PREMIÈRE INITIALISATION - Si nous n'avons jamais joué de piste
      if (lastTrackId === null && newTrackId) {
        console.log('FIRST LOAD: Initializing first track:', newTrackId);
        
        if (!audioInitializedRef.current) {
          try {
            // Stocker l'ID pour ne pas réinitialiser
            setLastTrackId(newTrackId);
            
            // Marquer que nous configurons
            isAdjustingPositionRef.current = true;
            
            // Définir l'URL et attacher un événement pour définir la position une fois prêt
            audioRef.current.src = newTrackUrl;
            
            // Fonction pour initialiser après le chargement
            const handleInitialLoad = () => {
              try {
                if (audioRef.current) {
                  // Définir la position
                  audioRef.current.currentTime = data.position;
                  lastPositionUpdateRef.current = now;
                  
                  // Si le serveur dit que ça joue et qu'on n'est pas en pause manuelle
                  if (data.isPlaying && !localPause) {
                    setTimeout(() => {
                      if (audioRef.current) {
                        console.log('Starting initial playback at position:', data.position);
                        audioRef.current.play().catch(err => {
                          console.error('Initial playback failed:', err);
                        });
                      }
                      isAdjustingPositionRef.current = false;
                    }, 500);
                  } else {
                    isAdjustingPositionRef.current = false;
                  }
                  
                  audioInitializedRef.current = true;
                }
              } catch (err) {
                console.error('Error in initial load:', err);
                isAdjustingPositionRef.current = false;
              }
            };
            
            // Attacher l'événement si nécessaire, sinon exécuter directement
            if (audioRef.current.readyState >= 2) {
              handleInitialLoad();
            } else {
              audioRef.current.addEventListener('loadedmetadata', handleInitialLoad, { once: true });
            }
          } catch (err) {
            console.error('Error setting up initial track:', err);
            isAdjustingPositionRef.current = false;
          }
        }
        return;
      }
      
      // CHANGEMENT DE PISTE - Quand la piste change réellement
      if (newTrackId && lastTrackId && newTrackId !== lastTrackId) {
        console.log('TRACK CHANGE: from', lastTrackId, 'to', newTrackId);
        
        try {
          // Stocker le nouvel ID
          setLastTrackId(newTrackId);
          
          // Marquer que nous ajustons
          isAdjustingPositionRef.current = true;
          
          // Arrêter la lecture actuelle
          audioRef.current.pause();
          
          // Charger la nouvelle URL
          audioRef.current.src = newTrackUrl;
          
          // Attendre le chargement avant de définir la position
          const handleTrackChange = () => {
            try {
              if (audioRef.current) {
                // Définir la position
                audioRef.current.currentTime = data.position;
                lastPositionUpdateRef.current = now;
                
                // Reprendre la lecture si nécessaire
                if (data.isPlaying && !localPause) {
                  setTimeout(() => {
                    if (audioRef.current) {
                      console.log('Playing new track at position:', data.position);
                      audioRef.current.play().catch(err => {
                        console.error('New track playback failed:', err);
                      });
                    }
                    isAdjustingPositionRef.current = false;
                  }, 500);
                } else {
                  isAdjustingPositionRef.current = false;
                }
              }
            } catch (err) {
              console.error('Error handling track change:', err);
              isAdjustingPositionRef.current = false;
            }
          };
          
          // Attacher l'événement si nécessaire
          if (audioRef.current.readyState >= 2) {
            handleTrackChange();
          } else {
            audioRef.current.addEventListener('loadedmetadata', handleTrackChange, { once: true });
          }
        } catch (err) {
          console.error('Error during track change:', err);
          isAdjustingPositionRef.current = false;
        }
        return;
      }
      
      // AJUSTEMENT DE POSITION - Si grande différence de position sur la même piste
      if (
        newTrackId === lastTrackId && 
        audioRef.current && 
        !isAdjustingPositionRef.current && 
        Math.abs(audioRef.current.currentTime - data.position) > 20 && // Seuil très élevé (20 sec)
        now - lastPositionUpdateRef.current > 30000 // 30 secondes minimum entre les ajustements
      ) {
        console.log('POSITION ADJUSTMENT: from', audioRef.current.currentTime, 'to', data.position);
        
        // Marquer que nous ajustons
        isAdjustingPositionRef.current = true;
        
        // Délai pour stabiliser
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
        }, 500);
      }
      
      // Mettre à jour l'état de lecture uniquement si l'utilisateur n'a pas mis en pause manuellement
      if (!localPause) {
        setIsPlaying(data.isPlaying);
      }
    } catch (error) {
      console.error('Error fetching radio state:', error);
    }
  };

  // Initialize and periodically update radio state
  useEffect(() => {
    console.log('Initializing GlobalPlayer with interval');
    
    // Initial fetch with a longer delay
    const initTimer = setTimeout(fetchRadioState, 2000);
    
    // Set up polling interval with increased delay (15 secondes)
    pollingRef.current = setInterval(fetchRadioState, 15000);
    
    // Clean up on unmount
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      clearTimeout(initTimer);
    };
  }, []);

  // Effect to handle audio playback when radio state changes
  useEffect(() => {
    // Si on est en train d'ajuster la position, ne pas modifier l'état de lecture
    if (!audioRef.current || !radioState || !currentTrack || isAdjustingPositionRef.current) return;
    
    // Play or pause based on radio state and local pause state
    if (isPlaying && !localPause && audioRef.current.paused) {
      console.log('Auto-playing based on state change');
      audioRef.current.play().catch(console.error);
    } else if ((!isPlaying || localPause) && !audioRef.current.paused) {
      console.log('Auto-pausing based on state change');
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
    console.log('Track ended naturally, waiting before requesting next track');
    // Attendre 2 secondes avant de demander la piste suivante pour éviter les conflits
    setTimeout(() => {
      console.log('Requesting next track after end');
      fetchRadioState();
    }, 2000);
  };

  // Créer l'élément audio une seule fois
  useEffect(() => {
    console.log('Creating audio element');
    
    if (!audioRef.current && typeof Audio !== 'undefined') {
      // Créer l'élément audio
      audioRef.current = new Audio();
      audioRef.current.volume = volume;
      audioRef.current.onended = handleTrackEnd;
      
      // Éviter la mise en mémoire tampon agressive
      // @ts-ignore - Cette propriété existe mais n'est pas dans la définition TypeScript
      if (typeof audioRef.current.preload !== 'undefined') {
        audioRef.current.preload = 'auto';
      }
      
      // Ajouter des gestionnaires pour surveiller les erreurs et sauts
      audioRef.current.onerror = (e) => {
        console.error('Audio playback error:', e);
      };
      
      audioRef.current.onstalled = () => {
        console.warn('Audio playback stalled');
      };
      
      audioRef.current.onwaiting = () => {
        console.log('Audio waiting for data...');
      };
      
      audioRef.current.oncanplay = () => {
        console.log('Audio can now be played');
      };
    }
    
    return () => {
      if (audioRef.current) {
        console.log('Cleaning up audio element');
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        audioRef.current.onstalled = null;
        audioRef.current.onwaiting = null;
        audioRef.current.oncanplay = null;
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