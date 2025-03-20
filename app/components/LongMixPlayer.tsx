'use client';

import { useState, useRef, useEffect } from 'react';
import { LongMix } from '@/app/types/longmix';
import Image from 'next/image';

interface LongMixPlayerProps {
  mix: LongMix;
  onClose: () => void;
}

export default function LongMixPlayer({ mix, onClose }: LongMixPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Formater le temps en HH:MM:SS
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Gérer le clic sur la barre de progression
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressBarRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const percentage = x / width;
    const newTime = percentage * mix.duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Gérer le changement de volume
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Mettre à jour le temps actuel pendant la lecture
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    audio.addEventListener('timeupdate', updateTime);
    
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
    };
  }, []);

  // Arrêter la radio quand on commence la lecture
  useEffect(() => {
    if (isPlaying) {
      // @ts-ignore
      if (window.radioPlayer?.isPlaying) {
        // @ts-ignore
        window.radioPlayer.pause();
      }
    }
  }, [isPlaying]);

  // Nettoyer à la fermeture
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-[#008F11] p-4 z-50">
      <div className="max-w-7xl mx-auto flex items-center gap-4">
        {/* Image de couverture */}
        <div className="w-16 h-16 relative flex-shrink-0">
          <Image
            src={mix.coverUrl}
            alt={mix.title}
            fill
            className="object-cover rounded"
          />
        </div>

        {/* Informations et contrôles */}
        <div className="flex-grow">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-[#00FF41] font-doto">{mix.title}</h3>
              <p className="text-[#008F11] text-sm">{mix.artist}</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Volume */}
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#008F11]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 9v6h4l5 5V4L7 9H3z" />
                </svg>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 appearance-none bg-[#008F11]/20 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#008F11]"
                />
              </div>

              {/* Bouton de fermeture */}
              <button
                onClick={onClose}
                className="text-[#008F11] hover:text-[#00FF41]"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#008F11] font-mono">
              {formatTime(currentTime)}
            </span>
            
            <div
              ref={progressBarRef}
              className="flex-grow h-1 bg-[#008F11]/20 rounded cursor-pointer"
              onClick={handleProgressClick}
            >
              <div
                className="h-full bg-[#008F11] rounded transition-all duration-300"
                style={{ width: `${(currentTime / mix.duration) * 100}%` }}
              />
            </div>
            
            <span className="text-xs text-[#008F11] font-mono">
              {formatTime(mix.duration)}
            </span>
          </div>
        </div>

        {/* Bouton Play/Pause */}
        <button
          onClick={() => {
            if (audioRef.current) {
              if (isPlaying) {
                audioRef.current.pause();
              } else {
                audioRef.current.play();
              }
              setIsPlaying(!isPlaying);
            }
          }}
          className="w-12 h-12 flex items-center justify-center bg-[#008F11] rounded-full hover:bg-[#00FF41] transition-colors"
        >
          {isPlaying ? (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="black">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="black">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Audio element */}
        <audio
          ref={audioRef}
          src={mix.mixUrl}
          preload="metadata"
          onEnded={() => setIsPlaying(false)}
        />
      </div>
    </div>
  );
} 