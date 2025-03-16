'use client';

import { useState } from 'react';
import { DiscogsSearchResult } from '@/app/services/discogs';

interface MetadataEnricherProps {
  filename: string;
  onEnrichmentComplete: () => void;
}

export default function MetadataEnricher({ filename, onEnrichmentComplete }: MetadataEnricherProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DiscogsSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/enrich', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename, searchQuery }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la recherche');
      }

      const data = await response.json();
      setSearchResults(data.results);
    } catch (err) {
      setError('Erreur lors de la recherche. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = async (releaseId: number) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/enrich', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename, releaseId }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour');
      }

      onEnrichmentComplete();
    } catch (err) {
      setError('Erreur lors de la mise à jour. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">Enrichir les métadonnées</h3>
      
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher sur Discogs..."
          className="flex-1 px-3 py-2 border rounded"
        />
        <button
          onClick={handleSearch}
          disabled={isLoading || !searchQuery}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Recherche...' : 'Rechercher'}
        </button>
      </div>

      {error && (
        <div className="text-red-600 mb-4">{error}</div>
      )}

      <div className="space-y-4">
        {searchResults.map((result) => (
          <div
            key={result.id}
            className="flex items-center gap-4 p-4 border rounded hover:bg-gray-50 cursor-pointer"
            onClick={() => handleSelect(result.id)}
          >
            {result.thumb && (
              <img
                src={result.thumb}
                alt={result.title}
                className="w-16 h-16 object-cover"
              />
            )}
            <div>
              <h4 className="font-medium">{result.title}</h4>
              <p className="text-sm text-gray-600">
                {result.artist} • {result.year}
              </p>
            </div>
          </div>
        ))}
      </div>

      {searchResults.length === 0 && searchQuery && !isLoading && (
        <p className="text-gray-600">Aucun résultat trouvé</p>
      )}
    </div>
  );
} 