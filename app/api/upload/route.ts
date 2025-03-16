import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import * as mm from 'music-metadata';
import { searchRelease, getReleaseDetails } from '@/app/services/discogs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith('audio/')) {
      return NextResponse.json(
        { error: 'Le fichier doit être un fichier audio' },
        { status: 400 }
      );
    }

    // Créer le dossier uploads s'il n'existe pas
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const filePath = path.join(uploadDir, file.name);

    // Sauvegarder le fichier
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Extraire les métadonnées initiales
    const metadata = await mm.parseBuffer(buffer);
    const initialQuery = metadata.common.title || metadata.common.artist || file.name.replace(/\.[^/.]+$/, "");

    try {
      // Recherche automatique sur Discogs
      const searchResults = await searchRelease(initialQuery);
      
      if (searchResults.length > 0) {
        // Utiliser le premier résultat
        const firstResult = searchResults[0];
        const details = await getReleaseDetails(firstResult.id);
        
        // Télécharger la pochette si disponible
        let imageBuffer;
        if (details.coverUrl) {
          const imageResponse = await fetch(details.coverUrl);
          imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        }

        // Mettre à jour les tags ID3
        const NodeID3 = (await import('node-id3')).default;
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
      }
    } catch (error) {
      console.error('Erreur lors de l\'enrichissement automatique:', error);
      // On continue même si l'enrichissement automatique échoue
    }

    return NextResponse.json({
      success: true,
      message: 'Fichier uploadé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload du fichier' },
      { status: 500 }
    );
  }
} 