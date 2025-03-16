'use client';

import { useState, useEffect } from 'react';
import MainLayout from './components/MainLayout';
import { Track } from './types/track';

export default function Home() {
  const [tracks, setTracks] = useState<Track[]>([]);

  useEffect(() => {
    const loadTracks = async () => {
      try {
        const response = await fetch('/api/tracks');
        const data = await response.json();
        if (data.tracks && data.tracks.length > 0) {
          setTracks(data.tracks);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des pistes:', error);
      }
    };

    loadTracks();
  }, []);

  return <MainLayout tracks={tracks} />;
}
