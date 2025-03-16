import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier n\'a été fourni' },
        { status: 400 }
      );
    }

    // Vérification du type de fichier
    if (!file.type.startsWith('audio/')) {
      return NextResponse.json(
        { error: 'Le fichier doit être un fichier audio' },
        { status: 400 }
      );
    }

    // Création du dossier uploads s'il n'existe pas
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      await writeFile(path.join(uploadDir, file.name), Buffer.from(await file.arrayBuffer()));
    } catch (error) {
      console.error('Erreur lors de l\'écriture du fichier:', error);
      return NextResponse.json(
        { error: 'Erreur lors de l\'enregistrement du fichier' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload du fichier' },
      { status: 500 }
    );
  }
} 