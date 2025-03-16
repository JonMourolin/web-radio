'use client';

import { useState, useEffect } from 'react';
import { Track } from '@/app/types/track';
import Image from 'next/image';

interface DiscogsResult {
  id: number;
  title: string;
  year: string;
  cover_image: string;
}

interface UploadState {
  status: 'idle' | 'uploading' | 'processing' | 'success' | 'error';
  progress: number;
  message: string;
}

export default function AdminPage() {
  const [files, setFiles] = useState<Track[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
    message: ''
  });
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [discogsResults, setDiscogsResults] = useState<DiscogsResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const loadFiles = async () => {
    try {
      const response = await fetch('/api/tracks');
      const data = await response.json();
      setFiles(data.tracks);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadState({
      status: 'uploading',
      progress: 0,
      message: 'Téléchargement en cours...'
    });

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Create XMLHttpRequest to track upload progress
      const xhr = new XMLHttpRequest();
      
      const uploadPromise = new Promise<Track>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadState(prev => ({
              ...prev,
              progress: progress
            }));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            resolve(response.track);
          } else {
            reject(new Error('Upload failed'));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.open('POST', '/api/upload');
        xhr.send(formData);
      });

      setUploadState(prev => ({
        ...prev,
        status: 'processing',
        message: 'Processing metadata...'
      }));

      const track = await uploadPromise;

      setUploadState({
        status: 'success',
        progress: 100,
        message: 'Upload complete!'
      });

      // Refresh the file list
      await loadFiles();

      // Reset upload state after a delay
      setTimeout(() => {
        setUploadState({
          status: 'idle',
          progress: 0,
          message: ''
        });
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadState({
        status: 'error',
        progress: 0,
        message: 'Upload failed. Please try again.'
      });
    }
  };

  const searchDiscogs = async (track: Track) => {
    setIsSearching(true);
    setSelectedFile(track.filename);
    setDiscogsResults([]);
    
    try {
      const response = await fetch(`/api/discogs?q=${encodeURIComponent(track.filename)}`);
      if (!response.ok) {
        throw new Error('Discogs search failed');
      }
      const data = await response.json();
      setDiscogsResults(data.results || []);
    } catch (error) {
      console.error('Error searching Discogs:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const updateMetadata = async (track: Track, result: DiscogsResult) => {
    try {
      // Format metadata as key-value pairs for Cloudinary context
      const metadata = {
        title: result.title.split(' - ')[1] || result.title,
        artist: result.title.split(' - ')[0],
        album: result.title.split(' - ')[1] || result.title,
        year: result.year,
        coverUrl: result.cover_image,
        // Add additional metadata as needed
        updated_at: new Date().toISOString(),
        source: 'discogs'
      };

      const response = await fetch('/api/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trackId: track.cloudinaryPublicId,
          metadata,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update metadata');
      }

      await loadFiles();
      setDiscogsResults([]);
    } catch (error) {
      console.error('Error updating metadata:', error);
    }
  };

  const handleDelete = async (track: Track) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${track.title}" ?`)) {
      return;
    }

    setIsDeleting(track.cloudinaryPublicId);
    try {
      const response = await fetch('/api/tracks', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publicId: track.cloudinaryPublicId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete track');
      }

      // Refresh the file list
      loadFiles();
    } catch (error) {
      console.error('Error deleting track:', error);
      alert('Une erreur est survenue lors de la suppression');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Administration</h1>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            {/* Upload Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Upload Files</h2>
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    disabled={uploadState.status !== 'idle'}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 transition-all disabled:opacity-50"
                  />
                </div>

                {uploadState.status !== 'idle' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className={`font-medium ${uploadState.status === 'error' ? 'text-red-600' : 'text-gray-600'}`}>
                        {uploadState.message}
                      </span>
                      {uploadState.status !== 'error' && (
                        <span className="text-gray-500">{uploadState.progress}%</span>
                      )}
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          uploadState.status === 'error' 
                            ? 'bg-red-500' 
                            : uploadState.status === 'success'
                            ? 'bg-green-500'
                            : 'bg-purple-500'
                        }`}
                        style={{ width: `${uploadState.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Files List */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Available Files</h2>
              <div className="space-y-4">
                {files.map((track) => (
                  <div
                    key={track.filename}
                    className="p-4 rounded-lg border border-gray-200 hover:border-purple-200 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <Image
                        src={track.coverUrl || '/default-cover.jpg'}
                        alt="Album cover"
                        width={50}
                        height={50}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-grow">
                        <h3 className="font-medium text-gray-900">{track.title}</h3>
                        <p className="text-sm text-gray-600">{track.artist}</p>
                        {track.album && (
                          <p className="text-sm text-gray-500">{track.album}</p>
                        )}
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            onClick={() => searchDiscogs(track)}
                            className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
                          >
                            Search on Discogs
                          </button>
                          <button
                            onClick={() => handleDelete(track)}
                            disabled={isDeleting === track.cloudinaryPublicId}
                            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors disabled:opacity-50"
                          >
                            {isDeleting === track.cloudinaryPublicId ? 'Suppression...' : 'Supprimer'}
                          </button>
                          <audio
                            controls
                            className="w-48 h-8"
                            src={track.cloudinaryUrl}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Preview & Discogs Results Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              {isSearching ? 'Searching Discogs...' : (discogsResults.length > 0 ? 'Select a Match' : 'Discogs Results')}
            </h2>
            
            {isSearching ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedFile && files.find(f => f.filename === selectedFile) && discogsResults.length === 0 && (
                  <div className="text-gray-500">
                    Click "Search on Discogs" to find metadata for this track
                  </div>
                )}
                
                {discogsResults.map((result) => (
                  <div
                    key={result.id}
                    className="p-4 border rounded-lg hover:border-purple-200 hover:bg-purple-50/50 cursor-pointer transition-all"
                    onClick={() => selectedFile && updateMetadata(files.find(f => f.filename === selectedFile)!, result)}
                  >
                    <div className="flex gap-4">
                      <Image
                        src={result.cover_image}
                        alt={result.title}
                        width={200}
                        height={200}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <div>
                        <h4 className="font-medium text-gray-900">{result.title}</h4>
                        <p className="text-sm text-gray-600">{result.year}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 