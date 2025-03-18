'use client';

import { Track } from '@/app/types/track';
import Image from 'next/image';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';

interface MainLayoutProps {
  tracks: Track[];
}

export default function MainLayout({ tracks }: MainLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-black">
      <Header currentPage="radio" />

      {/* Main Content - Matrix Image */}
      <main className="flex-grow relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[95%] h-[95%] relative">
            <Image
              src="https://res.cloudinary.com/dyom5zfbh/image/upload/v1742158676/web-radio-assets/wyzcqttcvbdhzuf3cuvn.jpg"
              alt="Matrix Neo"
              className="object-contain"
              fill
              priority
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
} 