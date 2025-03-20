'use client';

import { useState, useEffect } from 'react';
import { Track } from '@/app/types/track';
import { LongMix } from '@/app/types/longmix';
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
  // État pour les tracks radio
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [trackUploadState, setTrackUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
    message: ''
  });
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [discogsResults, setDiscogsResults] = useState<DiscogsResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // État pour les long mixes
  const [mixes, setMixes] = useState<LongMix[]>([]);
  const [mixUploadState, setMixUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
    message: ''
  });
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState<string>('');
  const [coverUploadState, setCoverUploadState] = useState<{mixId: string | null, status: 'idle' | 'uploading' | 'success' | 'error', message: string}>({
    mixId: null,
    status: 'idle',
    message: ''
  });
  const [editingTagsMixId, setEditingTagsMixId] = useState<string | null>(null);
  const [editingMixTags, setEditingMixTags] = useState<string[]>([]);
  const [newMixTag, setNewMixTag] = useState<string>('');

  // Chargement initial des données
  useEffect(() => {
    loadTracks();
    loadMixes();
    loadTags();
  }, []);

  // Fonctions pour les tracks radio
  const loadTracks = async () => {
    try {
      const response = await fetch('/api/tracks');
      const data = await response.json();
      setTracks(data.tracks);
    } catch (error) {
      console.error('Error loading tracks:', error);
    }
  };

  const handleTrackUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setTrackUploadState({
      status: 'uploading',
      progress: 0,
      message: 'Téléchargement en cours...'
    });

    const formData = new FormData();
    formData.append('file', file);

    try {
      const xhr = new XMLHttpRequest();
      
      const uploadPromise = new Promise<Track>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setTrackUploadState(prev => ({
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

      setTrackUploadState(prev => ({
        ...prev,
        status: 'processing',
        message: 'Traitement des métadonnées...'
      }));

      const track = await uploadPromise;

      setTrackUploadState({
        status: 'success',
        progress: 100,
        message: 'Upload terminé !'
      });

      await loadTracks();

      setTimeout(() => {
        setTrackUploadState({
          status: 'idle',
          progress: 0,
          message: ''
        });
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      setTrackUploadState({
        status: 'error',
        progress: 0,
        message: 'Échec de l\'upload. Veuillez réessayer.'
      });
    }
  };

  // Fonctions pour les long mixes
  const loadMixes = async () => {
    try {
      const response = await fetch('/api/longmixs');
      const data = await response.json();
      setMixes(data);
    } catch (error) {
      console.error('Error loading mixes:', error);
    }
  };

  const loadTags = async () => {
    try {
      const response = await fetch('/api/tags');
      const data = await response.json();
      setTags(data.map((tag: any) => tag.name));
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const handleMixUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('Starting mix upload:', file.name);

    setMixUploadState({
      status: 'uploading',
      progress: 0,
      message: 'Téléchargement en cours...'
    });

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/longmixs/upload', {
        method: 'POST',
        body: formData
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Error parsing response:', jsonError);
        throw new Error('Erreur serveur: La réponse n\'est pas au format JSON valide');
      }

      if (!response.ok) {
        throw new Error(data?.error || 'Échec de l\'upload');
      }

      console.log('Upload successful:', data);

      setMixUploadState({
        status: 'success',
        progress: 100,
        message: 'Upload terminé !'
      });

      await loadMixes();

      // Après un upload réussi, ouvrir automatiquement l'éditeur de tags après 500ms
      setTimeout(() => {
        const uploadedMix = data.mix;
        if (uploadedMix) {
          openTagEditor(uploadedMix);
        }
      }, 500);

      setTimeout(() => {
        setMixUploadState({
          status: 'idle',
          progress: 0,
          message: ''
        });
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      setMixUploadState({
        status: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Échec de l\'upload. Veuillez réessayer.'
      });
    }
  };

  // Fonctions Discogs (uniquement pour les tracks)
  const searchDiscogs = async (track: Track) => {
    setIsSearching(true);
    setSelectedTrack(track.filename);
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
      const metadata = {
        title: result.title.split(' - ')[1] || result.title,
        artist: result.title.split(' - ')[0],
        album: result.title.split(' - ')[1] || result.title,
        year: result.year,
        coverUrl: result.cover_image,
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

      await loadTracks();
      setDiscogsResults([]);
    } catch (error) {
      console.error('Error updating metadata:', error);
    }
  };

  // Fonctions de suppression
  const handleDeleteTrack = async (track: Track) => {
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

      await loadTracks();
    } catch (error) {
      console.error('Error deleting track:', error);
      alert('Une erreur est survenue lors de la suppression');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDeleteMix = async (mix: LongMix) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${mix.title}" ?`)) {
      return;
    }

    setIsDeleting(mix.cloudinaryPublicId);
    try {
      const response = await fetch('/api/longmixs', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publicId: mix.cloudinaryPublicId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete mix');
      }

      await loadMixes();
    } catch (error) {
      console.error('Error deleting mix:', error);
      alert('Une erreur est survenue lors de la suppression');
    } finally {
      setIsDeleting(null);
    }
  };

  // Ajouter un nouveau tag
  const addNewTag = async () => {
    if (!newTag.trim()) return;
    
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newTag.trim() }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 409) {  // Tag déjà existant
          alert(`Le tag "${newTag}" existe déjà.`);
        } else {
          throw new Error(data.error || 'Failed to add tag');
        }
      } else {
        await loadTags();
        setNewTag('');
      }
    } catch (error) {
      console.error('Error adding tag:', error);
      alert('Une erreur est survenue lors de l\'ajout du tag.');
    }
  };

  // Upload de couverture pour un mix
  const handleCoverUpload = async (mixId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setCoverUploadState({
      mixId,
      status: 'uploading',
      message: 'Upload de la couverture...'
    });
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mixId', mixId);
    
    try {
      const response = await fetch('/api/longmixs/cover', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }
      
      // Mettre à jour le mix dans l'état local
      setMixes(prev => 
        prev.map(mix => 
          mix.id === mixId ? { ...mix, coverUrl: data.coverUrl } : mix
        )
      );
      
      setCoverUploadState({
        mixId,
        status: 'success',
        message: 'Couverture mise à jour !'
      });
      
      // Réinitialiser après 2 secondes
      setTimeout(() => {
        setCoverUploadState({
          mixId: null,
          status: 'idle',
          message: ''
        });
      }, 2000);
      
    } catch (error) {
      console.error('Cover upload error:', error);
      setCoverUploadState({
        mixId,
        status: 'error',
        message: error instanceof Error ? error.message : 'Échec de l\'upload. Veuillez réessayer.'
      });
    }
  };

  // Ouvrir le modal d'édition de tags pour un mix
  const openTagEditor = (mix: LongMix) => {
    setEditingTagsMixId(mix.id);
    setEditingMixTags(mix.tags.map(tag => tag.name));
  };

  // Ajouter un tag au mix en cours d'édition
  const addTagToMix = () => {
    if (!newMixTag.trim()) return;
    
    if (!editingMixTags.includes(newMixTag.trim())) {
      setEditingMixTags(prev => [...prev, newMixTag.trim()]);
    }
    setNewMixTag('');
  };

  // Supprimer un tag du mix en cours d'édition
  const removeTagFromMix = (tagName: string) => {
    setEditingMixTags(prev => prev.filter(t => t !== tagName));
  };

  // Sauvegarder les tags du mix
  const saveTagsForMix = async () => {
    if (!editingTagsMixId) return;
    
    try {
      const response = await fetch('/api/longmixs/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mixId: editingTagsMixId,
          tagNames: editingMixTags
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update tags');
      }
      
      // Mettre à jour le mix dans l'état local
      setMixes(prev => 
        prev.map(mix => 
          mix.id === editingTagsMixId ? data.mix : mix
        )
      );
      
      // Fermer le modal
      setEditingTagsMixId(null);
      setEditingMixTags([]);
      
    } catch (error) {
      console.error('Error updating tags:', error);
      alert('Une erreur est survenue lors de la mise à jour des tags.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Administration</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Section Radio Tracks */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Radio Tracks</h2>
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleTrackUpload}
                    disabled={trackUploadState.status !== 'idle'}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 transition-all disabled:opacity-50"
                  />
                </div>

                {trackUploadState.status !== 'idle' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className={`font-medium ${trackUploadState.status === 'error' ? 'text-red-600' : 'text-gray-600'}`}>
                        {trackUploadState.message}
                      </span>
                      {trackUploadState.status !== 'error' && (
                        <span className="text-gray-500">{trackUploadState.progress}%</span>
                      )}
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          trackUploadState.status === 'error' 
                            ? 'bg-red-500' 
                            : trackUploadState.status === 'success'
                            ? 'bg-green-500'
                            : 'bg-purple-500'
                        }`}
                        style={{ width: `${trackUploadState.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Liste des tracks */}
              <div className="mt-8 space-y-4">
                {tracks.map(track => (
                  <div key={track.cloudinaryPublicId} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {track.coverUrl ? (
                          <Image
                            src={track.coverUrl}
                            alt={track.title}
                            width={48}
                            height={48}
                            className="rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                          </div>
                        )}
                        <div>
                          <h3 className="font-medium">{track.title || track.filename}</h3>
                          <p className="text-sm text-gray-500">{track.artist || 'Unknown Artist'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => searchDiscogs(track)}
                          disabled={isSearching}
                          className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors"
                        >
                          Discogs
                        </button>
                        <button
                          onClick={() => handleDeleteTrack(track)}
                          disabled={isDeleting === track.cloudinaryPublicId}
                          className="px-3 py-1 text-sm bg-red-50 text-red-700 rounded-full hover:bg-red-100 transition-colors"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>

                    {/* Résultats Discogs */}
                    {selectedTrack === track.filename && discogsResults.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <h4 className="font-medium text-sm text-gray-700">Résultats Discogs :</h4>
                        <div className="space-y-2">
                          {discogsResults.map(result => (
                            <div key={result.id} className="flex items-center justify-between bg-white p-2 rounded">
                              <div className="flex items-center space-x-2">
                                {result.cover_image && (
                                  <Image
                                    src={result.cover_image}
                                    alt={result.title}
                                    width={32}
                                    height={32}
                                    className="rounded"
                                  />
                                )}
                                <span className="text-sm">{result.title} ({result.year})</span>
                              </div>
                              <button
                                onClick={() => updateMetadata(track, result)}
                                className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded-full hover:bg-green-100"
                              >
                                Utiliser
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section Long Mixes */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Long Mixes</h2>
              <div className="space-y-4">
                {/* Retrait de la gestion des tags par défaut avant l'upload */}
                
                {/* Upload de mix */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Uploader un nouveau mix</label>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleMixUpload}
                    disabled={mixUploadState.status !== 'idle'}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 transition-all disabled:opacity-50"
                  />
                </div>

                {mixUploadState.status !== 'idle' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className={`font-medium ${mixUploadState.status === 'error' ? 'text-red-600' : 'text-gray-600'}`}>
                        {mixUploadState.message}
                      </span>
                      {mixUploadState.status !== 'error' && (
                        <span className="text-gray-500">{mixUploadState.progress}%</span>
                      )}
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          mixUploadState.status === 'error' 
                            ? 'bg-red-500' 
                            : mixUploadState.status === 'success'
                            ? 'bg-green-500'
                            : 'bg-purple-500'
                        }`}
                        style={{ width: `${mixUploadState.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Liste des mixes */}
              <div className="mt-8 space-y-4">
                {mixes.map(mix => (
                  <div key={mix.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="relative w-16 h-16">
                          {mix.coverUrl ? (
                            <Image
                              src={mix.coverUrl}
                              alt={mix.title}
                              width={64}
                              height={64}
                              className="rounded"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                              </svg>
                            </div>
                          )}
                          
                          {/* Input pour uploader une couverture */}
                          <label className="absolute bottom-0 right-0 bg-white p-1 rounded-full shadow-sm border border-gray-200 cursor-pointer hover:bg-gray-100">
                            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleCoverUpload(mix.id, e)}
                              className="hidden"
                            />
                          </label>
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-medium">{mix.title}</h3>
                          <p className="text-sm text-gray-500">{mix.artist}</p>
                          
                          {/* Affichage des tags et état de l'upload de couverture */}
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-1 mb-1">
                              {mix.tags && mix.tags.map(tag => (
                                <span key={tag.id} className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                                  {tag.name}
                                </span>
                              ))}
                              
                              {/* Bouton pour éditer les tags */}
                              <button
                                onClick={() => openTagEditor(mix)}
                                className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100"
                              >
                                <svg className="inline-block w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Tags
                              </button>
                            </div>
                            
                            {coverUploadState.mixId === mix.id && coverUploadState.status !== 'idle' && (
                              <p className={`text-xs mt-1 ${
                                coverUploadState.status === 'error' ? 'text-red-600' : 
                                coverUploadState.status === 'success' ? 'text-green-600' : 'text-blue-600'
                              }`}>
                                {coverUploadState.message}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleDeleteMix(mix)}
                        disabled={isDeleting === mix.cloudinaryPublicId}
                        className="px-3 py-1 text-sm bg-red-50 text-red-700 rounded-full hover:bg-red-100 transition-colors"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal pour éditer les tags d'un mix */}
      {editingTagsMixId && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Modifier les tags</h3>
            
            {/* Ajouter un nouveau tag au mix */}
            <div className="flex mb-4">
              <input
                type="text"
                value={newMixTag}
                onChange={(e) => setNewMixTag(e.target.value)}
                placeholder="Nouveau tag..."
                className="block w-full rounded-l-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
              />
              <button
                onClick={addTagToMix}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Ajouter
              </button>
            </div>
            
            {/* Liste des tags actuels du mix */}
            <div className="space-y-2 mb-4">
              <p className="text-sm font-medium text-gray-700">Tags sélectionnés :</p>
              {editingMixTags.length === 0 ? (
                <p className="text-sm text-gray-500">Aucun tag sélectionné</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {editingMixTags.map(tag => (
                    <div key={tag} className="flex items-center px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                      <span>{tag}</span>
                      <button 
                        onClick={() => removeTagFromMix(tag)}
                        className="ml-1 text-purple-500 hover:text-purple-700"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Sélectionner parmi les tags existants */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Tags disponibles :</p>
              <div className="flex flex-wrap gap-2">
                {tags
                  .filter(tag => !editingMixTags.includes(tag))
                  .map(tag => (
                    <button
                      key={tag}
                      onClick={() => setEditingMixTags(prev => [...prev, tag])}
                      className="px-2 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-full text-sm"
                    >
                      {tag}
                    </button>
                  ))
                }
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setEditingTagsMixId(null)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Annuler
              </button>
              <button
                onClick={saveTagsForMix}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 