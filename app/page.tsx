'use client';

import MainLayout from './components/MainLayout';
import { Track } from './types/track';

export default function Home() {
  // La page principale n'a plus besoin de charger les pistes
  // car le composant MainLayout récupère directement l'état de la radio
  // depuis l'API /api/stream
  return <MainLayout tracks={[]} />;
}
