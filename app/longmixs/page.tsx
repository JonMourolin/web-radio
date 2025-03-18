'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface LongMix {
  id: string;
  title: string;
  artist: string;
  duration: number;
  coverUrl: string;
  mixUrl: string;
  description: string;
}

// Données factices pour les long mixs
const DUMMY_MIXS: LongMix[] = [
  {
    id: 'mix1',
    title: 'Deep House Journey',
    artist: 'DJ Ambient',
    duration: 3600, // 1 heure
    coverUrl: 'https://res.cloudinary.com/dyom5zfbh/image/upload/v1742158676/web-radio-assets/wyzcqttcvbdhzuf3cuvn.jpg',
    mixUrl: '#',
    description: 'Une exploration d\'une heure dans le monde du Deep House'
  },
  {
    id: 'mix2',
    title: 'Ambient Voyage',
    artist: 'Nebula Sound',
    duration: 4500, // 1 heure 15 minutes
    coverUrl: 'https://res.cloudinary.com/dyom5zfbh/image/upload/v1742158676/web-radio-assets/wyzcqttcvbdhzuf3cuvn.jpg',
    mixUrl: '#',
    description: 'Sons ambiants et atmosphériques pour la méditation'
  },
  {
    id: 'mix3',
    title: 'Electronic Fusion',
    artist: 'Circuit Breaker',
    duration: 5400, // 1 heure 30 minutes
    coverUrl: 'https://res.cloudinary.com/dyom5zfbh/image/upload/v1742158676/web-radio-assets/wyzcqttcvbdhzuf3cuvn.jpg',
    mixUrl: '#',
    description: 'Un mélange d\'électronique, de techno et de house'
  }
];

export default function LongMixsPage() {
  const [mixs, setMixs] = useState<LongMix[]>(DUMMY_MIXS);

  // Format duration from seconds to HH:MM:SS
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
          <span className="text-[#00FF41] font-doto">Long Mixs</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-6 overflow-auto bg-black text-[#008F11]">
        <h2 className="text-[#00FF41] text-2xl font-doto mb-6">Long Mixs</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mixs.map(mix => (
            <div key={mix.id} className="bg-black border border-[#008F11] rounded-md overflow-hidden">
              <div className="aspect-square relative">
                <Image 
                  src={mix.coverUrl}
                  alt={mix.title}
                  fill
                  className="object-cover"
                />
              </div>
              
              <div className="p-4">
                <h3 className="text-[#00FF41] text-lg font-bold font-doto">{mix.title}</h3>
                <p className="text-[#008F11] font-doto">{mix.artist}</p>
                <p className="text-[#008F11]/70 text-sm mt-2">{mix.description}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-[#008F11]/70 text-sm">{formatDuration(mix.duration)}</span>
                  <button className="bg-[#008F11] text-black px-4 py-2 rounded-sm font-doto hover:bg-[#00FF41]">
                    Écouter
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer - Black band on bottom */}
      <footer className="h-16 bg-black text-white flex items-center justify-center">
        <p className="text-sm text-[#008F11]/60 font-doto">v0.2.18 - Vercel KV</p>
      </footer>
    </div>
  );
} 