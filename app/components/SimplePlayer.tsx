'use client';

import { useState, useEffect, useRef } from 'react';
import { Track } from '@/app/types/track';

const SimplePlayer = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const loadTracks = async () => {
      try {
        const response = await fetch('/api/tracks');
        const data = await response.json();
        if (data.tracks) {
          setTracks(data.tracks);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des pistes:', error);
      }
    };

    loadTracks();
  }, []);

  const currentTrack = tracks[currentTrackIndex];

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      audioRef.current.volume = Number(e.target.value);
    }
  };

  const handleEnded = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
  };

  if (!currentTrack) {
    return (
      <div className="bg-white rounded-lg shadow p-4 text-center text-gray-600">
        Aucun fichier audio disponible. Veuillez en ajouter via l'interface d'administration.
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="relative aspect-square w-full">
        <img
          src={currentTrack.metadata.coverUrl}
          alt={`Pochette de ${currentTrack.metadata.title}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
          <h2 className="text-xl font-bold truncate">{currentTrack.metadata.title}</h2>
          <p className="text-sm opacity-90 truncate">{currentTrack.metadata.artist}</p>
          {currentTrack.metadata.album && (
            <p className="text-sm opacity-75 truncate">{currentTrack.metadata.album}</p>
          )}
        </div>
      </div>

      <div className="p-4 bg-gray-50">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={handlePlayPause}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
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

          <div className="flex-1 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M17.536 6.464a7 7 0 010 11.072M9.464 8.464a5 5 0 010 7.072M7.464 6.464a7 7 0 010 11.072" />
            </svg>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              defaultValue="1"
              onChange={handleVolumeChange}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        <audio
          ref={audioRef}
          src={currentTrack.path}
          onEnded={handleEnded}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default SimplePlayer; 