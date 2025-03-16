import Discogs from 'disconnect';

const db = new Discogs.Client({
  consumerKey: process.env.DISCOGS_CONSUMER_KEY,
  consumerSecret: process.env.DISCOGS_CONSUMER_SECRET,
}).database();

export interface DiscogsSearchResult {
  id: number;
  title: string;
  artist: string;
  year: string;
  thumb: string;
  cover_image: string;
  type: string;
}

export async function searchRelease(query: string): Promise<DiscogsSearchResult[]> {
  try {
    const searchResults = await db.search({
      query,
      type: 'release',
      per_page: 5
    });

    return searchResults.results.map((result: any) => ({
      id: result.id,
      title: result.title,
      artist: result.artist || '',
      year: result.year || '',
      thumb: result.thumb || '',
      cover_image: result.cover_image || '',
      type: result.type
    }));
  } catch (error) {
    console.error('Erreur lors de la recherche Discogs:', error);
    throw error;
  }
}

export async function getReleaseDetails(releaseId: number) {
  try {
    const release = await db.getRelease(releaseId);
    return {
      title: release.title,
      artist: release.artists?.[0]?.name || '',
      album: release.title,
      year: release.year,
      genre: release.genres?.[0],
      style: release.styles?.[0],
      coverUrl: release.images?.[0]?.uri,
      tracklist: release.tracklist
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des détails:', error);
    throw error;
  }
} 