'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Rediriger vers la page des Long Mixes
    router.push('/longmixs');
  }, [router]);

  // Retourner un div vide pendant la redirection
  return <div className="h-screen bg-black"></div>;
}
