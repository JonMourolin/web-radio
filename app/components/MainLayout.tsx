'use client';

import { useState, useRef, useEffect } from 'react';
import { Track } from '@/app/types/track';
import Image from 'next/image';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';

interface MainLayoutProps {
  tracks: Track[];
}

interface RadioState {
  currentTrack: Track | null;
  position: number;
  isPlaying: boolean;
  nextTracks: Track[];
  remainingTime: number;
}

export default function MainLayout({ tracks }: MainLayoutProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [radioState, setRadioState] = useState<RadioState | null>(null);
  const [lastTrackId, setLastTrackId] = useState<string | null>(null);
  const [localPause, setLocalPause] = useState(false); // État de pause local
  const audioRef = useRef<HTMLAudioElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get current track from radio state
  const currentTrack = radioState?.currentTrack || null;

  // Format remaining time as MM:SS
  const formatTime = (seconds: number) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Fetch radio state from server
  const fetchRadioState = async () => {
    try {
      const response = await fetch('/api/stream');
      if (!response.ok) throw new Error('Failed to fetch radio state');
      const data = await response.json();
      
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

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setLocalPause(true); // Activer la pause locale
      } else {
        audioRef.current.play().catch(console.error);
        setLocalPause(false); // Désactiver la pause locale
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black">
      <Header 
        currentPage="radio" 
        currentTrack={currentTrack} 
        isPlaying={isPlaying}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        onTogglePlay={togglePlay}
      />

      {/* Main Content - Matrix Image */}
      <main className="flex-grow relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[95%] h-[95%] relative">
            <Image
              src="https://res.cloudinary.com/dyom5zfbh/image/upload/v1742158676/web-radio-assets/wyzcqttcvbdhzuf3cuvn.jpg"
              alt="Matrix Neo"
              className="object-contain"
              fill
              priority
            />
          </div>
        </div>
      </main>

      <Footer />

      {/* Hidden Audio Player */}
      {currentTrack?.cloudinaryUrl ? (
        <audio
          ref={audioRef}
          src={currentTrack.cloudinaryUrl}
          onEnded={handleTrackEnd}
          hidden
        />
      ) : null}
    </div>
  );
} 