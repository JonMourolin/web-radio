'use client';

import { useState, useEffect } from 'react';
import MetadataEnricher from '@/app/components/MetadataEnricher';
import { TrackMetadata } from '@/app/types/track';

export default function AdminPage() {
  const [files, setFiles] = useState<{ filename: string; metadata: TrackMetadata }[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const loadFiles = async () => {
    try {
      const response = await fetch('/api/tracks');
      const data = await response.json();
      setFiles(data.tracks.map((track: any) => ({
        filename: track.metadata.filename,
        metadata: track.metadata
      })));
    } catch (error) {
      console.error('Erreur lors du chargement des fichiers:', error);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'upload');
      }

      loadFiles();
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Administration</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="bg-white rounded-lg shadow p-4 mb-8">
            <h2 className="text-xl font-semibold mb-4">Upload de fichiers</h2>
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold mb-4">Fichiers disponibles</h2>
            <div className="space-y-2">
              {files.map(({ filename, metadata }) => (
                <div
                  key={filename}
                  className={`p-3 rounded border cursor-pointer ${
                    selectedFile === filename ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedFile(filename)}
                >
                  <h3 className="font-medium">{metadata.title}</h3>
                  <p className="text-sm text-gray-600">{metadata.artist}</p>
                  {metadata.album && (
                    <p className="text-sm text-gray-500">{metadata.album}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          {selectedFile && (
            <MetadataEnricher
              filename={selectedFile}
              onEnrichmentComplete={() => {
                loadFiles();
                setSelectedFile(null);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
} 