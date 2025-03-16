'use client';

import { useState, useRef, useEffect } from 'react';
import { Track } from '@/app/types/track';
import Image from 'next/image';

interface MainLayoutProps {
  tracks: Track[];
}

export default function MainLayout({ tracks }: MainLayoutProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [shuffledTracks, setShuffledTracks] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Get current track
  const currentTrack = shuffledTracks[currentIndex];

  // Function to shuffle array randomly
  const shuffleArray = (array: Track[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Initialize shuffled tracks
  useEffect(() => {
    if (tracks.length > 0) {
      const shuffled = shuffleArray(tracks);
      setShuffledTracks(shuffled);
    }
  }, [tracks]);

  // Handle track end and play next track
  const handleTrackEnd = () => {
    if (shuffledTracks.length === 0) return;
    
    const nextIndex = (currentIndex + 1) % shuffledTracks.length;
    setCurrentIndex(nextIndex);
  };

  // Effect to handle audio playback when currentIndex changes
  useEffect(() => {
    if (audioRef.current && isPlaying && currentTrack?.cloudinaryUrl) {
      audioRef.current.play().catch(console.error);
    }
  }, [currentIndex, currentTrack, isPlaying]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(console.error);
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
        <p className="text-sm text-[#008F11]/60 font-doto">v0.2.6</p>
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