'use client';

import SharedLayout from './components/SharedLayout';
import Image from 'next/image';

export default function Home() {
  return (
    <SharedLayout currentPage="radio">
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
    </SharedLayout>
  );
}
