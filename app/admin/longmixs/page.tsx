'use client';

import { useState, useRef, useEffect } from 'react';
import { LongMix, Tag } from '@/app/types/longmix';
import Image from 'next/image';

export default function AdminLongMixsPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [mixs, setMixs] = useState<LongMix[]>([]);
  const [currentMix, setCurrentMix] = useState<Partial<LongMix>>({
    title: '',
    artist: '',
    description: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Charger les tags et les mixs au montage
  useEffect(() => {
    fetchTags();
    fetchMixs();
  }, []);

  // Récupérer les tags
  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags');
      if (response.ok) {
        const data = await response.json();
        setTags(data);
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  };

  // Récupérer les mixs
  const fetchMixs = async () => {
    try {
      const response = await fetch('/api/longmixs');
      if (response.ok) {
        const data = await response.json();
        setMixs(data);
      }
    } catch (error) {
      console.error('Failed to fetch mixs:', error);
    }
  };

  // Créer un nouveau tag
  const createTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName }),
      });

      if (response.ok) {
        const newTag = await response.json();
        setTags([...tags, newTag]);
        setNewTagName('');
      }
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  };

  // Gérer l'upload du mix
  const handleMixUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/longmixs/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentMix(prev => ({
          ...prev,
          mixUrl: data.url,
          cloudinaryPublicId: data.publicId,
          duration: data.duration,
        }));
        setUploadProgress(100);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Gérer l'upload de la cover
  const handleCoverUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentMix(prev => ({
          ...prev,
          coverUrl: data.url,
        }));
      }
    } catch (error) {
      console.error('Cover upload failed:', error);
    }
  };

  // Créer un nouveau mix
  const createMix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMix.title || !currentMix.artist || !currentMix.mixUrl) return;

    try {
      const response = await fetch('/api/longmixs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...currentMix,
          tags: selectedTags,
        }),
      });

      if (response.ok) {
        const newMix = await response.json();
        setMixs([newMix, ...mixs]);
        setCurrentMix({
          title: '',
          artist: '',
          description: '',
        });
        setSelectedTags([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (coverInputRef.current) coverInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to create mix:', error);
    }
  };

  return (
    <div className="p-6 bg-black text-[#008F11]">
      <h1 className="text-2xl font-doto mb-8 text-[#00FF41]">Gestion des Long Mixs</h1>

      {/* Section des tags */}
      <div className="mb-8 p-4 border border-[#008F11] rounded-md">
        <h2 className="text-xl font-doto mb-4 text-[#00FF41]">Tags</h2>
        
        <form onSubmit={createTag} className="mb-4 flex gap-2">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="Nouveau tag..."
            className="flex-1 bg-black border border-[#008F11] p-2 text-[#008F11] placeholder-[#008F11]/50"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#008F11] text-black font-doto hover:bg-[#00FF41]"
          >
            Ajouter
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <span
              key={tag.id}
              className="px-3 py-1 rounded border border-[#008F11] text-sm cursor-pointer hover:border-[#00FF41]"
              onClick={() => {
                setSelectedTags(prev => 
                  prev.includes(tag.id)
                    ? prev.filter(id => id !== tag.id)
                    : [...prev, tag.id]
                );
              }}
              style={{
                backgroundColor: selectedTags.includes(tag.id) ? '#008F11' : 'transparent',
                color: selectedTags.includes(tag.id) ? 'black' : '#008F11',
              }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      </div>

      {/* Formulaire d'upload de mix */}
      <form onSubmit={createMix} className="space-y-4 p-4 border border-[#008F11] rounded-md">
        <h2 className="text-xl font-doto mb-4 text-[#00FF41]">Nouveau Mix</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 font-doto">Titre</label>
            <input
              type="text"
              value={currentMix.title}
              onChange={(e) => setCurrentMix(prev => ({ ...prev, title: e.target.value }))}
              className="w-full bg-black border border-[#008F11] p-2 text-[#008F11]"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-doto">Artiste</label>
            <input
              type="text"
              value={currentMix.artist}
              onChange={(e) => setCurrentMix(prev => ({ ...prev, artist: e.target.value }))}
              className="w-full bg-black border border-[#008F11] p-2 text-[#008F11]"
              required
            />
          </div>
        </div>

        <div>
          <label className="block mb-2 font-doto">Description</label>
          <textarea
            value={currentMix.description}
            onChange={(e) => setCurrentMix(prev => ({ ...prev, description: e.target.value }))}
            className="w-full bg-black border border-[#008F11] p-2 text-[#008F11] h-32"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 font-doto">Fichier Audio</label>
            <input
              type="file"
              ref={fileInputRef}
              accept="audio/*"
              onChange={(e) => e.target.files?.[0] && handleMixUpload(e.target.files[0])}
              className="w-full bg-black border border-[#008F11] p-2 text-[#008F11]"
              required
            />
            {isUploading && (
              <div className="mt-2 h-2 bg-[#008F11]/20 rounded">
                <div
                  className="h-full bg-[#008F11] rounded transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block mb-2 font-doto">Image de couverture</label>
            <input
              type="file"
              ref={coverInputRef}
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleCoverUpload(e.target.files[0])}
              className="w-full bg-black border border-[#008F11] p-2 text-[#008F11]"
              required
            />
          </div>
        </div>

        {currentMix.coverUrl && (
          <div className="mt-4">
            <Image
              src={currentMix.coverUrl}
              alt="Cover preview"
              width={200}
              height={200}
              className="object-cover rounded"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isUploading || !currentMix.mixUrl}
          className="w-full px-4 py-2 bg-[#008F11] text-black font-doto hover:bg-[#00FF41] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? 'Upload en cours...' : 'Créer le mix'}
        </button>
      </form>

      {/* Liste des mixs existants */}
      <div className="mt-8">
        <h2 className="text-xl font-doto mb-4 text-[#00FF41]">Mixs existants</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mixs.map(mix => (
            <div key={mix.id} className="border border-[#008F11] rounded-md p-4">
              {mix.coverUrl && (
                <Image
                  src={mix.coverUrl}
                  alt={mix.title}
                  width={200}
                  height={200}
                  className="w-full h-48 object-cover rounded mb-4"
                />
              )}
              <h3 className="font-doto text-[#00FF41]">{mix.title}</h3>
              <p className="text-sm">{mix.artist}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {mix.tags.map(tag => (
                  <span key={tag.id} className="text-xs px-2 py-1 bg-[#008F11]/20 rounded">
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 