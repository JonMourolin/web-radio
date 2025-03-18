'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface PlaylistTrack {
  id: string;
  title: string;
  artist: string;
  duration: number;
  coverUrl: string;
  audioUrl: string;
  added: string; // Date ajoutée à la playlist
}

// Données factices pour la playlist
const DUMMY_PLAYLIST: PlaylistTrack[] = [
  {
    id: 'track1',
    title: 'Midnight City',
    artist: 'M83',
    duration: 245, // 4:05
    coverUrl: 'https://res.cloudinary.com/dyom5zfbh/image/upload/v1742158676/web-radio-assets/wyzcqttcvbdhzuf3cuvn.jpg',
    audioUrl: '#',
    added: '2024-03-15'
  },
  {
    id: 'track2',
    title: 'Innerbloom',
    artist: 'RÜFÜS DU SOL',
    duration: 587, // 9:47
    coverUrl: 'https://res.cloudinary.com/dyom5zfbh/image/upload/v1742158676/web-radio-assets/wyzcqttcvbdhzuf3cuvn.jpg',
    audioUrl: '#',
    added: '2024-03-16'
  },
  {
    id: 'track3',
    title: 'Another Dimension',
    artist: 'Daft Punk',
    duration: 198, // 3:18
    coverUrl: 'https://res.cloudinary.com/dyom5zfbh/image/upload/v1742158676/web-radio-assets/wyzcqttcvbdhzuf3cuvn.jpg',
    audioUrl: '#',
    added: '2024-03-17'
  },
  {
    id: 'track4',
    title: 'Digital Love',
    artist: 'Daft Punk',
    duration: 301, // 5:01
    coverUrl: 'https://res.cloudinary.com/dyom5zfbh/image/upload/v1742158676/web-radio-assets/wyzcqttcvbdhzuf3cuvn.jpg',
    audioUrl: '#',
    added: '2024-03-18'
  },
  {
    id: 'track5',
    title: 'Strobe',
    artist: 'Deadmau5',
    duration: 607, // 10:07
    coverUrl: 'https://res.cloudinary.com/dyom5zfbh/image/upload/v1742158676/web-radio-assets/wyzcqttcvbdhzuf3cuvn.jpg',
    audioUrl: '#',
    added: '2024-03-19'
  }
];

export default function PlaylistPage() {
  const [tracks, setTracks] = useState<PlaylistTrack[]>(DUMMY_PLAYLIST);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);

  // Format duration from seconds to MM:SS
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date to display in a readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Handle play button click
  const handlePlay = (trackId: string) => {
    setCurrentTrackId(trackId);
    // Play logic would be implemented here
  };

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Header - Black band on top */}
      <header className="h-20 bg-black text-white flex items-center px-6 z-50">
        <div className="flex items-center">
          <Link href="/" className="mr-6">
            <h1 className="text-xl font-normal text-[#008F11] font-doto tracking-wider lowercase">jon sound library</h1>
          </Link>
        </div>

        <div className="flex items-center ml-auto">
          <Link 
            href="/" 
            className="text-[#008F11] hover:text-[#00FF41] font-doto mr-4"
          >
            Radio
          </Link>
          <Link 
            href="/longmixs" 
            className="text-[#008F11] hover:text-[#00FF41] font-doto mr-4"
          >
            Long Mixs
          </Link>
          <span className="text-[#00FF41] font-doto">Playlist</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-6 overflow-auto bg-black text-[#008F11]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[#00FF41] text-2xl font-doto">My Playlist</h2>
          <button className="bg-[#008F11] text-black px-4 py-2 rounded-sm font-doto hover:bg-[#00FF41]">
            Add Tracks
          </button>
        </div>
        
        <div className="w-full">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#008F11]/30">
                <th className="text-left py-3 px-4 text-[#008F11] font-doto">#</th>
                <th className="text-left py-3 px-4 text-[#008F11] font-doto">Title</th>
                <th className="text-left py-3 px-4 text-[#008F11] font-doto hidden md:table-cell">Artist</th>
                <th className="text-left py-3 px-4 text-[#008F11] font-doto hidden md:table-cell">Added</th>
                <th className="text-left py-3 px-4 text-[#008F11] font-doto">Duration</th>
                <th className="text-right py-3 px-4 text-[#008F11] font-doto">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tracks.map((track, index) => (
                <tr 
                  key={track.id} 
                  className={`border-b border-[#008F11]/10 hover:bg-[#008F11]/5 ${currentTrackId === track.id ? 'bg-[#008F11]/10' : ''}`}
                >
                  <td className="py-3 px-4 text-[#008F11]">{index + 1}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-800 rounded overflow-hidden mr-3">
                        {track.coverUrl ? (
                          <Image
                            src={track.coverUrl}
                            alt={track.title}
                            className="w-full h-full object-cover"
                            width={40}
                            height={40}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                            No Cover
                          </div>
                        )}
                      </div>
                      <span className="text-[#00FF41] font-doto">{track.title}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-[#008F11] hidden md:table-cell">{track.artist}</td>
                  <td className="py-3 px-4 text-[#008F11]/70 text-sm hidden md:table-cell">{formatDate(track.added)}</td>
                  <td className="py-3 px-4 text-[#008F11]/70">{formatDuration(track.duration)}</td>
                  <td className="py-3 px-4 text-right">
                    <button 
                      onClick={() => handlePlay(track.id)}
                      className="text-[#008F11] hover:text-[#00FF41] mr-2"
                    >
                      {currentTrackId === track.id ? (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="6" y="4" width="4" height="16" rx="1" />
                          <rect x="14" y="4" width="4" height="16" rx="1" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>
                    <button className="text-[#008F11] hover:text-[#00FF41]">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM8 9h8v10H8V9zm7.5-5l-1-1h-5l-1 1H5v2h14V4h-3.5z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Footer - Black band on bottom */}
      <footer className="h-16 bg-black text-white flex items-center justify-center">
        <p className="text-sm text-[#008F11]/60 font-doto">v0.2.19 - Vercel KV</p>
      </footer>
    </div>
  );
} 