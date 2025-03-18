'use client';

import dynamic from 'next/dynamic';

// Importer dynamiquement le GlobalPlayer pour éviter les erreurs côté serveur
const GlobalPlayer = dynamic(() => import('./GlobalPlayer'), { ssr: false });

export default function GlobalPlayerWrapper() {
  return <GlobalPlayer />;
} 