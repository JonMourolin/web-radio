'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        alert('Fichier uploadé avec succès !');
        setFile(null);
      } else {
        throw new Error('Erreur lors de l\'upload');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'upload du fichier');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6">Administration</h1>
          
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                onChange={handleFileChange}
                accept="audio/*"
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-blue-600 hover:text-blue-800"
              >
                {file ? file.name : 'Cliquez pour sélectionner un fichier audio'}
              </label>
            </div>

            <button
              type="submit"
              disabled={!file || uploading}
              className={`w-full py-2 px-4 rounded-lg text-white ${
                !file || uploading
                  ? 'bg-gray-400'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {uploading ? 'Upload en cours...' : 'Uploader'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 