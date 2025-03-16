import { NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const files = await readdir(uploadDir);
    
    // Filtrer pour ne garder que les fichiers audio
    const audioFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.mp3', '.wav', '.ogg', '.m4a'].includes(ext);
    });

    return NextResponse.json({ tracks: audioFiles });
  } catch (error) {
    console.error('Erreur lors de la lecture des fichiers:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la lecture des fichiers' },
      { status: 500 }
    );
  }
} 