'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import SharedLayout from '@/app/components/SharedLayout';
import LongMixPlayer from '@/app/components/LongMixPlayer';
import { LongMix } from '@/app/types/longmix';

export default function LongMixsPage() {
  const [mixs, setMixs] = useState<LongMix[]>([]);
  const [currentMix, setCurrentMix] = useState<LongMix | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les mixs au montage
  useEffect(() => {
    fetchMixs();
  }, []);

  // Récupérer les mixs depuis l'API
  const fetchMixs = async () => {
    try {
      const response = await fetch('/api/longmixs');
      if (response.ok) {
        const data = await response.json();
        setMixs(data);
      }
    } catch (error) {
      console.error('Failed to fetch mixs:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-[#00FF41]">Chargement...</div>
          </div>
        ) : mixs.length === 0 ? (
          <div className="text-center text-[#008F11]/70 py-12">
            Aucun mix disponible pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mixs.map(mix => (
              <div 
                key={mix.id} 
                className="flex flex-col bg-black transition-all duration-300 cursor-pointer"
                onClick={() => setCurrentMix(mix)}
              >
                <div className="relative aspect-square border border-[#008F11] overflow-hidden">
                  <Image 
                    src={mix.coverUrl}
                    alt={mix.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-all duration-500 filter grayscale hover:grayscale-0"
                    priority
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent h-16">
                    <span className="absolute bottom-3 right-3 bg-black/60 text-[#00FF41] px-2 py-1 text-xs rounded font-doto">
                      {formatDuration(mix.duration)}
                    </span>
                    <button className="absolute bottom-3 left-3 bg-[#008F11] text-black px-3 py-1 rounded-sm font-doto hover:bg-[#00FF41] transition-colors duration-300 flex items-center text-xs">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Écouter
                    </button>
                  </div>
                </div>
                
                <div className="pt-3 pb-1">
                  <h3 className="text-[#00FF41] text-base font-medium truncate">{mix.title}</h3>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {mix.tags.map(tag => (
                      <span key={tag.id} className="text-xs px-2 py-0.5 bg-[#008F11]/20 rounded-sm text-[#008F11]">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lecteur de mix */}
        {currentMix && (
          <LongMixPlayer
            mix={currentMix}
            onClose={() => setCurrentMix(null)}
          />
        )}
      </div>
    </SharedLayout>
  );
} 