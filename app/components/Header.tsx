'use client';

import Link from 'next/link';
import { useState } from 'react';

interface HeaderProps {
  currentPage: 'longmixs';
}

export default function Header({ currentPage }: HeaderProps) {
  return (
    <header className="h-20 bg-black text-white flex items-center px-6 z-50">
      <div className="flex items-center">
        {/* Titre du site */}
        <h1 className="text-xl font-normal text-[#008F11] font-doto tracking-wider lowercase">jon sound library</h1>
      </div>

      {/* Navigation Links - Uniquement Long Mixs maintenant */}
      <div className="flex items-center mx-6">
        <span className="text-[#00FF41] font-doto">Long Mixs</span>
      </div>

      {/* Espace à droite pour maintenir l'alignement */}
      <div className="ml-auto"></div>
    </header>
  );
} 