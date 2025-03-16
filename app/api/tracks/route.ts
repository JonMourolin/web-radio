import { NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import path from 'path';
import * as mm from 'music-metadata';
import { Track, TrackMetadata } from '@/app/types/track';
import crypto from 'crypto';

async function getTrackMetadata(filePath: string, filename: string): Promise<TrackMetadata> {
  try {
    const buffer = await readFile(filePath);
    const metadata = await mm.parseBuffer(buffer);
    
    return {
      title: metadata.common.title || filename,
      artist: metadata.common.artist || 'Artiste inconnu',
      album: metadata.common.album,
      coverUrl: metadata.common.picture?.[0] ? 
        `/api/cover/${encodeURIComponent(filename)}` : 
        '/images/default-cover.jpg',
      duration: metadata.format.duration,
      filename
    };
  } catch (error) {
    console.error('Erreur lors de la lecture des métadonnées:', error);
    return {
      title: filename,
      artist: 'Artiste inconnu',
      filename,
      coverUrl: '/images/default-cover.jpg'
    };
  }
}

export async function GET() {
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const files = await readdir(uploadDir);
    
    // Filtrer pour ne garder que les fichiers audio
    const audioFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.mp3', '.wav', '.ogg', '.m4a'].includes(ext);
    });

    const tracks: Track[] = await Promise.all(
      audioFiles.map(async (filename) => {
        const filePath = path.join(uploadDir, filename);
        const metadata = await getTrackMetadata(filePath, filename);
        
        return {
          id: crypto.createHash('md5').update(filename).digest('hex'),
          path: `/uploads/${filename}`,
          metadata
        };
      })
    );

    return NextResponse.json({ tracks });
  } catch (error) {
    console.error('Erreur lors de la lecture des fichiers:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la lecture des fichiers' },
      { status: 500 }
    );
  }
} 