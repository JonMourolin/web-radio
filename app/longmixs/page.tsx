'use client';

import { useState } from 'react';
import Image from 'next/image';
import SharedLayout from '@/app/components/SharedLayout';

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
    description: 'Une exploration d\'une heure dans le monde du Deep House avec des rythmes envoûtants et des mélodies atmosphériques. Parfait pour créer une ambiance détendue mais énergique dans n\'importe quel espace.'
  },
  {
    id: 'mix2',
    title: 'Ambient Voyage',
    artist: 'Nebula Sound',
    duration: 4500, // 1 heure 15 minutes
    coverUrl: 'https://res.cloudinary.com/dyom5zfbh/image/upload/e_art:audrey/v1742158676/web-radio-assets/wyzcqttcvbdhzuf3cuvn.jpg',
    mixUrl: '#',
    description: 'Partez pour un voyage sonore à travers des paysages sonores ambiants et atmosphériques. Ce mix de 1h15 combine des textures sonores éthérées et des rythmes subtils pour une expérience méditative profonde.'
  },
  {
    id: 'mix3',
    title: 'Electronic Fusion',
    artist: 'Circuit Breaker',
    duration: 5400, // 1 heure 30 minutes
    coverUrl: 'https://res.cloudinary.com/dyom5zfbh/image/upload/e_art:incognito/v1742158676/web-radio-assets/wyzcqttcvbdhzuf3cuvn.jpg',
    mixUrl: '#',
    description: 'Un mélange audacieux de 1h30 fusionnant électro, techno et house progressive. Cette session énergique traverse différents styles électroniques avec des transitions fluides et des drops puissants qui vous feront bouger.'
  }
];

export default function LongMixsPage() {
  const [mixs] = useState<LongMix[]>(DUMMY_MIXS);

  // Format duration from seconds to a natural format like "1h 30min"
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}min`;
    }
  };
  
  // Format duration from seconds to HH:MM:SS for technical display
  const formatTechnicalDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SharedLayout currentPage="longmixs">
      <div className="p-6 overflow-auto bg-black text-[#008F11] h-full">
        <h2 className="text-[#00FF41] text-2xl font-doto mb-3">Long Mixs</h2>
        
        <p className="text-[#008F11] mb-6 max-w-2xl">
          Des sessions de musique électronique prolongées pour une ambiance continue. Chaque mix est soigneusement créé pour vous offrir une expérience immersive pendant vos sessions de travail, relaxation ou soirées.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mixs.map(mix => (
            <div key={mix.id} className="bg-black border border-[#008F11] rounded-md overflow-hidden transform transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(0,255,65,0.3)]">
              <div className="aspect-square relative">
                <Image 
                  src={mix.coverUrl}
                  alt={mix.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition-all duration-500 hover:scale-110"
                  priority
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent h-16">
                  <span className="absolute bottom-3 right-3 bg-black/60 text-[#00FF41] px-2 py-1 text-xs rounded font-doto">
                    {formatDuration(mix.duration)}
                  </span>
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="text-[#00FF41] text-lg font-bold font-doto">{mix.title}</h3>
                <p className="text-[#008F11] font-doto">{mix.artist}</p>
                <p className="text-[#008F11]/70 text-sm mt-2 line-clamp-2">{mix.description}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-[#008F11]/70 text-sm">{formatTechnicalDuration(mix.duration)}</span>
                  <button className="bg-[#008F11] text-black px-4 py-2 rounded-sm font-doto hover:bg-[#00FF41] transition-colors duration-300 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Écouter
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center text-[#008F11]/70 text-sm">
          <p>Note: Ces mixes sont des exemples. De vrais mixes seront bientôt disponibles.</p>
        </div>
      </div>
    </SharedLayout>
  );
} 