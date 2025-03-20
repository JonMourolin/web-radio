'use client';

import { useState, useEffect } from 'react';
import { LongMix } from '@/app/types/longmix';
import Image from 'next/image';

interface UploadState {
  status: 'idle' | 'uploading' | 'processing' | 'success' | 'error';
  progress: number;
  message: string;
}

export default function AdminPage() {
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

  // Chargement des mixs et tags au montage
  useEffect(() => {
    fetchMixes();
    fetchTags();
  }, []);

  // Récupération des mixs
  const fetchMixes = async () => {
    try {
      const response = await fetch('/api/get-longmixs');
      if (response.ok) {
        const data = await response.json();
        setMixes(data.resources);
      }
    } catch (error) {
      console.error('Failed to fetch mixes:', error);
    }
  };

  // Récupération des tags
  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags');
      if (response.ok) {
        const data = await response.json();
        setTags(data.map((tag: any) => tag.name));
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  };

  // Fonction pour uploader un mix
  const handleMixUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    setMixUploadState({
      status: 'uploading',
      progress: 0,
      message: 'Téléchargement du mix...'
    });
    
    try {
      const response = await fetch('/api/longmixs', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMixUploadState({
          status: 'success',
          progress: 100,
          message: 'Mix uploaded successfully!'
        });
        fetchMixes(); // Refresh mixes list
      } else {
        setMixUploadState({
          status: 'error',
          progress: 0,
          message: data.error || 'Failed to upload mix'
        });
      }
    } catch (error: any) {
      setMixUploadState({
        status: 'error',
        progress: 0,
        message: error.message || 'Failed to upload mix'
      });
    }
  };

  // Fonction pour supprimer un mix
  const handleDeleteMix = async (mixId: string) => {
    if (!confirm('Are you sure you want to delete this mix?')) return;
    
    try {
      const response = await fetch(`/api/longmixs/${mixId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchMixes(); // Refresh list after delete
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete mix');
      }
    } catch (error) {
      console.error('Failed to delete mix:', error);
    }
  };

  // Fonction pour ajouter un tag
  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTag.trim() })
      });
      
      if (response.ok) {
        setNewTag('');
        fetchTags(); // Refresh tags
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add tag');
      }
    } catch (error) {
      console.error('Failed to add tag:', error);
    }
  };

  // Commencer à éditer les tags d'un mix
  const startEditingMixTags = (mix: LongMix) => {
    setEditingTagsMixId(mix.id);
    setEditingMixTags(mix.tags.map(tag => tag.name));
  };

  // Sauvegarder les tags modifiés
  const saveEditingMixTags = async () => {
    if (!editingTagsMixId) return;
    
    try {
      const response = await fetch(`/api/longmixs/${editingTagsMixId}/tags`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: editingMixTags })
      });
      
      if (response.ok) {
        setEditingTagsMixId(null);
        fetchMixes(); // Refresh mixes to show updated tags
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update tags');
      }
    } catch (error) {
      console.error('Failed to update mix tags:', error);
    }
  };

  // Format user-friendly duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${hours > 0 ? hours + 'h ' : ''}${minutes}m ${remainingSeconds}s`;
  };

  // Uploader une couverture pour un mix
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>, mixId: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('cover', file);
    
    setCoverUploadState({
      mixId,
      status: 'uploading',
      message: 'Uploading cover...'
    });
    
    try {
      const response = await fetch(`/api/longmixs/${mixId}/cover`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        setCoverUploadState({
          mixId,
          status: 'success',
          message: 'Cover uploaded!'
        });
        fetchMixes(); // Refresh list to show new cover
        setTimeout(() => {
          setCoverUploadState({ mixId: null, status: 'idle', message: '' });
        }, 3000);
      } else {
        const data = await response.json();
        setCoverUploadState({
          mixId,
          status: 'error',
          message: data.error || 'Failed to upload cover'
        });
      }
    } catch (error: any) {
      setCoverUploadState({
        mixId,
        status: 'error',
        message: error.message || 'Failed to upload cover'
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Administration</h1>

      {/* Section Long Mixes */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-4">Long Mixes</h2>
        
        {/* Upload form for Long Mix */}
        <form onSubmit={handleMixUpload} className="mb-8 p-4 border rounded-lg">
          <h3 className="text-lg font-medium mb-3">Upload New Mix</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input 
                type="text" 
                name="title" 
                required 
                className="w-full p-2 border rounded" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Artist</label>
              <input 
                type="text" 
                name="artist" 
                required 
                className="w-full p-2 border rounded" 
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea 
              name="description" 
              className="w-full p-2 border rounded h-24" 
            ></textarea>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map(tag => (
                <label key={tag} className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="tags"
                    value={tag}
                    checked={selectedTags.includes(tag)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTags([...selectedTags, tag]);
                      } else {
                        setSelectedTags(selectedTags.filter(t => t !== tag));
                      }
                    }}
                    className="mr-1"
                  />
                  <span>{tag}</span>
                </label>
              ))}
            </div>
            <div className="flex">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add new tag"
                className="p-2 border rounded flex-grow"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="ml-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Tag
              </button>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Mix File (MP3)</label>
            <input 
              type="file" 
              name="mix" 
              accept=".mp3,audio/mp3" 
              required 
              className="w-full p-2 border rounded" 
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Cover Image</label>
            <input 
              type="file" 
              name="cover" 
              accept="image/*" 
              className="w-full p-2 border rounded" 
            />
          </div>
          
          <button 
            type="submit" 
            disabled={mixUploadState.status === 'uploading'} 
            className={`px-4 py-2 rounded text-white ${
              mixUploadState.status === 'uploading' ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {mixUploadState.status === 'uploading' ? 'Uploading...' : 'Upload Mix'}
          </button>
          
          {mixUploadState.status !== 'idle' && (
            <div className={`mt-3 p-3 rounded ${
              mixUploadState.status === 'success' ? 'bg-green-100 text-green-800' :
              mixUploadState.status === 'error' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {mixUploadState.message}
              {mixUploadState.status === 'uploading' && (
                <div className="w-full bg-gray-200 rounded h-2 mt-2">
                  <div 
                    className="bg-blue-500 h-2 rounded" 
                    style={{ width: `${mixUploadState.progress}%` }}
                  ></div>
                </div>
              )}
            </div>
          )}
        </form>
        
        {/* List of Long Mixes */}
        <h3 className="text-lg font-medium mb-3">Manage Mixes</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Cover</th>
                <th className="px-4 py-2 text-left">Title</th>
                <th className="px-4 py-2 text-left">Artist</th>
                <th className="px-4 py-2 text-left">Duration</th>
                <th className="px-4 py-2 text-left">Tags</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mixes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center text-gray-500">
                    No mixes available
                  </td>
                </tr>
              ) : (
                mixes.map(mix => (
                  <tr key={mix.id} className="border-b">
                    <td className="px-4 py-3">
                      <div className="relative w-16 h-16">
                        {mix.coverUrl ? (
                          <Image
                            src={mix.coverUrl}
                            alt={mix.title}
                            width={64}
                            height={64}
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                            No Cover
                          </div>
                        )}
                        <div className="mt-1">
                          <label className="cursor-pointer bg-blue-500 text-white text-xs px-2 py-1 rounded inline-block">
                            Change
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleCoverUpload(e, mix.id)}
                              className="hidden"
                            />
                          </label>
                          
                          {coverUploadState.mixId === mix.id && (
                            <div className={`text-xs mt-1 ${
                              coverUploadState.status === 'success' ? 'text-green-600' :
                              coverUploadState.status === 'error' ? 'text-red-600' :
                              'text-blue-600'
                            }`}>
                              {coverUploadState.message}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{mix.title}</td>
                    <td className="px-4 py-3">{mix.artist}</td>
                    <td className="px-4 py-3">{formatDuration(mix.duration)}</td>
                    <td className="px-4 py-3">
                      {editingTagsMixId === mix.id ? (
                        <div>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {tags.map(tag => (
                              <label key={tag} className="inline-flex items-center text-sm">
                                <input
                                  type="checkbox"
                                  checked={editingMixTags.includes(tag)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setEditingMixTags([...editingMixTags, tag]);
                                    } else {
                                      setEditingMixTags(editingMixTags.filter(t => t !== tag));
                                    }
                                  }}
                                  className="mr-1"
                                />
                                <span>{tag}</span>
                              </label>
                            ))}
                          </div>
                          <div className="flex mt-2">
                            <button
                              onClick={saveEditingMixTags}
                              className="bg-green-500 text-white text-xs px-2 py-1 rounded mr-2"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingTagsMixId(null)}
                              className="bg-gray-500 text-white text-xs px-2 py-1 rounded"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex flex-wrap gap-1 mb-1">
                            {mix.tags.map(tag => (
                              <span key={tag.id} className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
                                {tag.name}
                              </span>
                            ))}
                            {mix.tags.length === 0 && (
                              <span className="text-gray-400 text-xs">No tags</span>
                            )}
                          </div>
                          <button
                            onClick={() => startEditingMixTags(mix)}
                            className="text-blue-500 text-xs underline"
                          >
                            Edit Tags
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteMix(mix.id)}
                        className="bg-red-500 text-white text-xs px-2 py-1 rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 