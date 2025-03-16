import { NextRequest, NextResponse } from 'next/server';
import { searchRelease, getReleaseDetails } from '@/app/services/discogs';
import path from 'path';
import { promises as fs } from 'fs';
import * as mm from 'music-metadata';
import NodeID3 from 'node-id3';

export async function POST(request: NextRequest) {
  try {
    const { filename, searchQuery } = await request.json();

    if (!filename || !searchQuery) {
      return NextResponse.json(
        { error: 'Filename et searchQuery sont requis' },
        { status: 400 }
      );
    }

    // Recherche sur Discogs
    const searchResults = await searchRelease(searchQuery);

    if (searchResults.length === 0) {
      return NextResponse.json(
        { error: 'Aucun résultat trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({ results: searchResults });
  } catch (error) {
    console.error('Erreur lors de l\'enrichissement:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'enrichissement' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { filename, releaseId } = await request.json();
    const filePath = path.join(process.cwd(), 'public', 'uploads', filename);

    // Vérifier si le fichier existe
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        { error: 'Fichier non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer les détails de la release
    const details = await getReleaseDetails(releaseId);

    // Télécharger la pochette si disponible
    let imageBuffer;
    if (details.coverUrl) {
      const imageResponse = await fetch(details.coverUrl);
      imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    }

    // Mettre à jour les tags ID3
    const tags = {
      title: details.title,
      artist: details.artist,
      album: details.album,
      year: details.year,
      genre: details.genre,
      image: imageBuffer ? {
        mime: 'image/jpeg',
        type: {
          id: 3,
          name: 'front cover'
        },
        description: 'Album cover',
        imageBuffer
      } : undefined
    };

    NodeID3.write(tags, filePath);

    return NextResponse.json({
      success: true,
      metadata: details
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des métadonnées:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des métadonnées' },
      { status: 500 }
    );
  }
} 