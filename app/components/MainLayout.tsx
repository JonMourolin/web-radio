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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-purple-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-black/30 backdrop-blur-sm z-50">
        <div className="container mx-auto h-full px-4 flex items-center justify-between">
          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center text-white"
          >
            {isPlaying ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
            )}
          </button>

          <h1 className="text-2xl font-bold text-white">JON RADIO</h1>

          <div className="w-32">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Section */}
          <div className="md:col-span-2 bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <p className="text-white/80">
              Welcome to Jon Radio - Your Personal Music Stream
            </p>
          </div>

          {/* Right Section - Player */}
          <div className="md:col-span-1">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              {currentTrack ? (
                <div>
                  <div className="aspect-square mb-4 bg-gray-800 rounded-lg overflow-hidden">
                    {currentTrack.coverUrl ? (
                      <Image
                        src={currentTrack.coverUrl}
                        alt="Album cover"
                        className="w-full h-full object-cover"
                        width={500}
                        height={500}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        No Cover
                      </div>
                    )}
                  </div>
                  <div className="text-white">
                    <h2 className="text-xl font-bold mb-2">{currentTrack.title}</h2>
                    <p className="text-white/80">{currentTrack.artist}</p>
                    <p className="text-white/60">{currentTrack.album}</p>
                  </div>
                </div>
              ) : (
                <div className="text-white/60">No track loaded</div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Hidden Audio Player */}
      <audio
        ref={audioRef}
        src={currentTrack?.cloudinaryUrl || ''}
        onEnded={handleTrackEnd}
        hidden
      />
    </div>
  );
} 