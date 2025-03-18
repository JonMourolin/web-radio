'use client';

import { useState, useRef, useEffect } from 'react';
import { Track } from '@/app/types/track';
import Image from 'next/image';
import Link from 'next/link';

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
      {/* Header - Black band on top */}
      <header className="h-20 bg-black text-white flex items-center px-6 z-50">
        <div className="flex items-center">
          <button
            onClick={togglePlay}
            className="flex items-center justify-center mr-4"
          >
            {isPlaying ? (
              <svg className="w-14 h-14" viewBox="0 0 24 24" fill="#008F11">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg className="w-14 h-14" viewBox="0 0 24 24" fill="#008F11">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <h1 className="text-xl font-normal text-[#008F11] font-doto tracking-wider lowercase">jon sound library</h1>
        </div>

        {/* Navigation Links */}
        <div className="flex items-center mx-6">
          <span className="text-[#00FF41] font-doto mr-4">Radio</span>
          <Link 
            href="/longmixs" 
            className="text-[#008F11] hover:text-[#00FF41] font-doto mr-4"
          >
            Long Mixs
          </Link>
          <Link 
            href="/playlist" 
            className="text-[#008F11] hover:text-[#00FF41] font-doto"
          >
            Playlist
          </Link>
        </div>

        {/* Current track info in header - push to right */}
        <div className="flex items-center space-x-4 ml-auto">
          {currentTrack && (
            <>
              <div className="w-12 h-12 bg-gray-800 rounded overflow-hidden">
                {currentTrack.coverUrl ? (
                  <Image
                    src={currentTrack.coverUrl}
                    alt="Album cover"
                    className="w-full h-full object-cover"
                    width={48}
                    height={48}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                    No Cover
                  </div>
                )}
              </div>
              <div className="text-white text-sm">
                <p className="truncate max-w-[200px]">
                  <span className="font-bold">{currentTrack.artist}</span> - {currentTrack.title}
                </p>
              </div>
            </>
          )}
          
          {/* Volume Control */}
          <div className="flex items-center ml-4 space-x-2">
            <svg className="w-5 h-5 text-[#008F11]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3z" />
            </svg>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 appearance-none bg-gray-700 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#008F11]"
            />
          </div>
        </div>
      </header>

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

      {/* Footer - Black band on bottom */}
      <footer className="h-16 bg-black text-white flex items-center justify-center">
        <p className="text-sm text-[#008F11]/60 font-doto">v0.2.19 - Vercel KV</p>
      </footer>

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