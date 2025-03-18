'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Track } from '@/app/types/track';

interface HeaderProps {
  currentPage: 'radio' | 'longmixs';
  currentTrack?: Track | null;
  isPlaying?: boolean;
  volume?: number;
  onVolumeChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTogglePlay?: () => void;
}

export default function Header({
  currentPage,
  currentTrack = null,
  isPlaying = false,
  volume = 1,
  onVolumeChange,
  onTogglePlay
}: HeaderProps) {
  return (
    <header className="h-20 bg-black text-white flex items-center px-6 z-50">
      <div className="flex items-center">
        {currentPage === 'radio' && onTogglePlay ? (
          <button
            onClick={onTogglePlay}
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
        ) : (
          <Link href="/" className="mr-6">
            <h1 className="text-xl font-normal text-[#008F11] font-doto tracking-wider lowercase">jon sound library</h1>
          </Link>
        )}

        {currentPage === 'radio' && (
          <h1 className="text-xl font-normal text-[#008F11] font-doto tracking-wider lowercase">jon sound library</h1>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex items-center mx-6">
        {currentPage === 'radio' ? (
          <span className="text-[#00FF41] font-doto mr-4">Radio</span>
        ) : (
          <Link 
            href="/" 
            className="text-[#008F11] hover:text-[#00FF41] font-doto mr-4"
          >
            Radio
          </Link>
        )}

        {currentPage === 'longmixs' ? (
          <span className="text-[#00FF41] font-doto">Long Mixs</span>
        ) : (
          <Link 
            href="/longmixs" 
            className="text-[#008F11] hover:text-[#00FF41] font-doto"
          >
            Long Mixs
          </Link>
        )}
      </div>

      {/* Current track info and volume control - push to right */}
      {currentPage === 'radio' && currentTrack && (
        <div className="flex items-center space-x-4 ml-auto">
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
          
          {/* Volume Control */}
          {onVolumeChange && (
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
                onChange={onVolumeChange}
                className="w-16 h-1 appearance-none bg-gray-700 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#008F11]"
              />
            </div>
          )}
        </div>
      )}
      
      {/* Push content to right for pages other than radio */}
      {currentPage !== 'radio' && <div className="ml-auto"></div>}
    </header>
  );
} 