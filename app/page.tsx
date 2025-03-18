'use client';

import SharedLayout from './components/SharedLayout';
import Image from 'next/image';

export default function Home() {
  return (
    <SharedLayout currentPage="radio">
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* Image Matrix en plein écran */}
        <div className="absolute inset-0">
          <Image
            src="https://res.cloudinary.com/dyom5zfbh/image/upload/v1742158676/web-radio-assets/wyzcqttcvbdhzuf3cuvn.jpg"
            alt="Matrix Neo"
            className="object-cover"
            fill
            priority
          />
        </div>
      </div>
    </SharedLayout>
  );
}
