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
  
  // État pour gérer la fin des pistes
  const [trackEnding, setTrackEnding] = useState(false);
  const [notifiedTrackEnd, setNotifiedTrackEnd] = useState<string | null>(null);
  
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

      // Ajouter des diagnostics pour comparer les durées côté client vs serveur
      if (data?.currentTrack && audioRef.current && audioRef.current.duration) {
        // Si le client indique que l'audio est sur le point de se terminer mais que le serveur n'a pas encore avancé
        const clientRemainingTime = audioRef.current.duration - audioRef.current.currentTime;
        const metadataDuration = data.currentTrack.duration;
        
        // Pour les écarts importants, afficher un avertissement
        if (clientRemainingTime < 3 && data.position < metadataDuration - 5) {
          console.warn(`Client nearly finished (${clientRemainingTime.toFixed(2)}s left) but server position still at ${data.position.toFixed(2)}/${metadataDuration}s`);
          
          // Si la piste est vraiment à la fin, notifier le serveur
          if (clientRemainingTime < 0.5 && !trackEnding) {
            const trackId = data.currentTrack.cloudinaryPublicId;
            console.log(`Detected end-of-track discrepancy, notifying server. trackId: ${trackId}`);
            setTrackEnding(true);
            notifyTrackEnd(trackId, audioRef.current.duration);
          }
        }
        
        // Afficher les écarts significatifs entre les positions client et serveur
        if (Math.abs(data.position - audioRef.current.currentTime) > 10) {
          console.log(`Position discrepancy - Server: ${data.position.toFixed(2)}s, Client: ${audioRef.current.currentTime.toFixed(2)}s, Diff: ${(data.position - audioRef.current.currentTime).toFixed(2)}s`);
        }
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

  // Fonction pour notifier le serveur de la fin d'une piste
  const notifyTrackEnd = async (trackId: string, actualDuration?: number) => {
    if (notifiedTrackEnd === trackId) {
      console.log('Track end déjà notifié pour cette piste, ignoré.');
      return;
    }
    
    console.log(`Notifying server that track ${trackId} has ended. Actual duration: ${actualDuration || 'unknown'}`);
    setNotifiedTrackEnd(trackId);
    
    try {
      const response = await fetch('/api/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'trackEnded',
          trackId,
          actualDuration
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Server acknowledged track end', data);
        // Réinitialiser l'état à la prochaine piste
        setTrackEnding(false);
      } else {
        console.warn('Server rejected track end notification', data);
        
        // Si le serveur a refusé car la piste n'a pas joué assez longtemps
        if (data.message && data.message.includes("n'a pas joué assez longtemps")) {
          console.log('Track change rejected because it has not played long enough. Continuing playback...');
          
          // Réinitialiser l'état pour permettre une nouvelle notification plus tard
          setTrackEnding(false);
          setNotifiedTrackEnd(null);
          
          // Si la lecture s'est arrêtée (en raison de l'événement 'ended'), 
          // on redémarre la lecture depuis la position actuelle
          if (audioRef.current && audioRef.current.paused && radioState?.isPlaying && !localPause) {
            // Calculer la position actuelle depuis le serveur
            const serverPosition = radioState.position;
            
            console.log(`Restarting playback at position ${serverPosition.toFixed(2)}s`);
            
            try {
              // Définir la position actuelle
              audioRef.current.currentTime = serverPosition;
              
              // Redémarrer la lecture
              audioRef.current.play().catch(err => {
                console.error('Failed to restart playback:', err);
              });
            } catch (err) {
              console.error('Error restarting playback:', err);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error notifying track end', error);
    }
  };
  
  // Gestionnaire de fin de piste basée sur l'événement ended de l'audio
  const handleTrackEnd = () => {
    const audio = audioRef.current;
    
    if (!audio || !radioState?.currentTrack) return;
    
    // Vérifier si la piste est vraiment finie (à moins de 1.5 secondes de la fin)
    const remainingTime = audio.duration - audio.currentTime;
    console.log(`Track ended event, remaining time: ${remainingTime.toFixed(2)}s, Duration: ${audio.duration.toFixed(2)}s, Current position: ${audio.currentTime.toFixed(2)}s`);
    
    // Si on n'est pas vraiment à la fin (peut arriver avec certains navigateurs),
    // alors retarder le changement de piste jusqu'à ce qu'on soit vraiment à la fin
    if (remainingTime > 1.0 && !audio.ended) {
      console.log(`Track end detected prematurely, waiting until track really ends (${remainingTime.toFixed(2)}s remaining)`);
      
      // Mettre en place un intervalle pour vérifier la fin réelle
      const checkRealEnd = setInterval(() => {
        if (!audioRef.current) {
          clearInterval(checkRealEnd);
          return;
        }
        
        const newRemainingTime = audioRef.current.duration - audioRef.current.currentTime;
        console.log(`Waiting for real end, remaining: ${newRemainingTime.toFixed(2)}s`);
        
        if (newRemainingTime <= 0.2 || audioRef.current.ended) {
          clearInterval(checkRealEnd);
          console.log(`Now track has really ended at position ${audioRef.current.currentTime.toFixed(2)}s / ${audioRef.current.duration.toFixed(2)}s`);
          
          // Maintenant qu'on est vraiment à la fin, notifier
          setTrackEnding(true);
          if (radioState?.currentTrack) {
            notifyTrackEnd(
              radioState.currentTrack.cloudinaryPublicId, 
              audioRef.current.duration
            );
          }
        }
      }, 100);
      
      return;
    }
    
    // Si on arrive ici, c'est que la piste est vraiment terminée
    // Marquer que la fin de la piste a été détectée
    setTrackEnding(true);
    
    // Forcer le passage à la piste suivante, même avec un reste de temps
    // car l'événement ended est assez fiable
    const trackId = radioState.currentTrack.cloudinaryPublicId;
    const actualDuration = audio.duration;
    
    console.log(`Audio has ended, notifying server. Track: ${trackId}, Duration: ${actualDuration.toFixed(2)}s, Current position: ${audio.currentTime.toFixed(2)}s`);
    
    // Notifier le serveur de la fin de la piste
    notifyTrackEnd(trackId, actualDuration);
    
    // En tant que mesure de sécurité, essayons également de passer manuellement à la piste suivante
    // si le serveur ne répond pas rapidement
    setTimeout(async () => {
      // Si nous sommes toujours sur la même piste après 3 secondes, forcer le changement
      if (
        radioState?.currentTrack &&
        radioState.currentTrack.cloudinaryPublicId === trackId
      ) {
        console.log('Fallback: Track change not detected after timeout, forcing next track...');
        try {
          // Appeler manuellement l'API nextTrack
          const response = await fetch('/api/stream', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action: 'nextTrack' })
          });
          
          if (response.ok) {
            console.log('Forced track change successful');
            // Recharger l'état radio pour obtenir la nouvelle piste
            fetchRadioState();
          }
        } catch (error) {
          console.error('Error in fallback track change:', error);
        }
      }
    }, 3000);
  };
  
  // Vérifications périodiques pour la fin des pistes
  useEffect(() => {
    if (!audioRef.current || !radioState?.currentTrack) return;
    
    const audio = audioRef.current;
    
    // Vérifier si on approche de la fin de la piste (dans les 5 dernières secondes)
    const checkTrackEnd = () => {
      if (!audio || !radioState?.currentTrack || trackEnding) return;
      
      if (audio.duration && audio.currentTime) {
        const remainingTime = audio.duration - audio.currentTime;
        
        // Si moins de 5 secondes restantes, préparer la fin de piste
        if (remainingTime <= 5 && !trackEnding) {
          console.log(`Approaching track end, remaining: ${remainingTime.toFixed(2)}s`);
        }
        
        // Si moins de 0.5 secondes ou si la piste est vraiment terminée, 
        // considérer comme la fin et notifier le serveur
        if ((remainingTime <= 0.5 || audio.ended) && !trackEnding) {
          const trackId = radioState.currentTrack.cloudinaryPublicId;
          const actualDuration = audio.duration;
          
          console.log(`Track about to end, notifying server preemptively. Duration: ${actualDuration.toFixed(2)}s, Current position: ${audio.currentTime.toFixed(2)}s, Remaining: ${remainingTime.toFixed(2)}s`);
          
          // Bloquer toute nouvelle lecture jusqu'à la fin complète de la piste
          if (audio.currentTime >= actualDuration - 0.2) {
            // On est vraiment à la fin, on peut notifier
            setTrackEnding(true);
            notifyTrackEnd(trackId, actualDuration);
          } else {
            console.log(`Waiting for track to completely finish (${remainingTime.toFixed(2)}s remaining)`);
            // Ne pas encore notifier la fin si on n'est pas totalement à la fin
          }
        }
        
        // Surveiller les écarts importants entre la durée et la position actuelle
        if (Math.abs(audio.duration - audio.currentTime) <= 0.2 && !trackEnding) {
          console.log(`Track reached natural end: ${audio.currentTime.toFixed(2)}s / ${audio.duration.toFixed(2)}s`);
          const trackId = radioState.currentTrack.cloudinaryPublicId;
          setTrackEnding(true);
          notifyTrackEnd(trackId, audio.duration);
        }
      }
    };
    
    // Exécuter plus fréquemment pour être plus précis sur la fin des pistes
    const checkInterval = setInterval(checkTrackEnd, 200);
    
    return () => clearInterval(checkInterval);
  }, [radioState?.currentTrack, trackEnding]);
  
  // Initialiser l'élément audio
  useEffect(() => {
    console.log('Creating audio element');
    
    if (!audioRef.current && typeof Audio !== 'undefined') {
      // Créer l'élément audio
      audioRef.current = new Audio();
      audioRef.current.volume = volume;
      
      // Désactiver explicitement la lecture en boucle
      audioRef.current.loop = false;
      
      // Éviter la mise en mémoire tampon agressive
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
      
      // Ajouter un gestionnaire d'événement ended directement ici
      audioRef.current.onended = () => {
        console.log('Audio ended event triggered directly');
        handleTrackEnd();
      };
      
      console.log('Audio element created and initialized');
    }
    
    return () => {
      if (audioRef.current) {
        console.log('Cleaning up audio element');
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current.onerror = null;
        audioRef.current.onstalled = null;
        audioRef.current.onwaiting = null;
        audioRef.current.oncanplay = null;
        audioRef.current.onended = null;
      }
    };
  }, [volume]);
  
  // Ajouter le gestionnaire d'événement ended à l'élément audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const onEnded = () => {
      console.log('Audio ended event triggered from separate useEffect');
      handleTrackEnd();
    };
    
    audio.addEventListener('ended', onEnded);
    
    return () => {
      audio.removeEventListener('ended', onEnded);
    };
  }, [radioState]);
  
  // Gérer le changement de piste
  useEffect(() => {
    if (currentTrack) {
      // Réinitialiser l'état de fin de piste à chaque changement de piste
      setTrackEnding(false);
      setNotifiedTrackEnd(null);
    }
  }, [currentTrack]);

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
      diagnose: () => {
        const audio = audioRef.current;
        if (!audio) return 'Audio element not initialized';
        
        const diagnosticInfo = {
          audioState: {
            currentTime: audio.currentTime,
            duration: audio.duration,
            ended: audio.ended,
            remainingTime: audio.duration ? (audio.duration - audio.currentTime).toFixed(2) + 's' : 'unknown',
            paused: audio.paused,
            src: audio.src,
            readyState: audio.readyState,
            networkState: audio.networkState,
            volume: audio.volume,
            muted: audio.muted,
          },
          componentState: {
            isPlaying: isPlaying,
            volume: volume,
            trackEnding: trackEnding,
            notifiedTrackEnd: notifiedTrackEnd,
            currentTrack: currentTrack ? {
              title: currentTrack.title,
              artist: currentTrack.artist,
              duration: currentTrack.duration,
              cloudinaryId: currentTrack.cloudinaryPublicId,
            } : null,
          },
          serverState: radioState,
        };
        
        console.table(diagnosticInfo.audioState);
        console.table(diagnosticInfo.componentState);
        console.log('Server state:', diagnosticInfo.serverState);
        
        return diagnosticInfo;
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
  }, [isPlaying, currentTrack, volume, lastTrackId, localPause, trackEnding, notifiedTrackEnd]);

  return null; // Pas de rendu visible nécessaire
} 