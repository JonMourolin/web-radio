'use client';

import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';

interface SharedLayoutProps {
  children: React.ReactNode;
  currentPage: 'radio' | 'longmixs';
}

export default function SharedLayout({ children, currentPage }: SharedLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Header avec currentPage pour savoir quel lien est actif */}
      <Header currentPage={currentPage} />
      
      {/* Main Content - Contenu spécifique à chaque page */}
      <main className="flex-grow relative overflow-hidden">
        {children}
      </main>
      
      {/* Footer partagé */}
      <Footer />
    </div>
  );
} 