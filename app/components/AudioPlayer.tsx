'use client';

import { useState, useEffect } from 'react';
import H5AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';

const AudioPlayer = () => {
  const [tracks, setTracks] = useState<string[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  useEffect(() => {
    // Fonction pour charger la liste des fichiers
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

  const handleNextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
  };

  const currentTrack = tracks[currentTrackIndex];
  const trackName = currentTrack?.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'Aucune piste';

  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-800">{trackName}</h2>
      </div>
      {currentTrack ? (
        <div className="bg-white rounded-lg shadow">
          <H5AudioPlayer
            autoPlay={false}
            src={`/uploads/${currentTrack}`}
            showJumpControls={false}
            layout="stacked"
            onEnded={handleNextTrack}
            className="rounded-lg"
          />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-4 text-center text-gray-600">
          Aucun fichier audio disponible. Veuillez en ajouter via l'interface d'administration.
        </div>
      )}
    </div>
  );
};

export default AudioPlayer; 