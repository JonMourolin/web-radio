'use client';

import SharedLayout from './components/SharedLayout';
import StreamPlayer from './components/StreamPlayer';
import Image from 'next/image';

export default function Home() {
  return (
    <SharedLayout currentPage="radio">
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="w-[95%] h-[70%] relative mb-4">
          <Image
            src="https://res.cloudinary.com/dyom5zfbh/image/upload/v1742158676/web-radio-assets/wyzcqttcvbdhzuf3cuvn.jpg"
            alt="Matrix Neo"
            className="object-contain"
            fill
            priority
          />
        </div>
        
        {/* Nouveau lecteur de streaming */}
        <div className="w-full max-w-4xl px-4">
          <StreamPlayer serverUrl="http://localhost:8000" />
        </div>
      </div>
    </SharedLayout>
  );
}
