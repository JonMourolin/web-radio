import { NextRequest } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
const { readFile } = fs;

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    // Attendre que params soit disponible
    const filename = await Promise.resolve(decodeURIComponent(params.filename));
    
    // Construire le chemin du fichier
    const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
    
    try {
      // Lire le fichier
      const buffer = await readFile(filePath);
      
      // Retourner l'image avec le bon type MIME
      return new Response(buffer, {
        headers: {
          'Content-Type': 'image/jpeg', // Ajuster selon le type d'image
          'Cache-Control': 'public, max-age=31536000',
        },
      });
    } catch (error) {
      // Si le fichier n'existe pas, retourner une erreur 404
      return new Response('Image not found', { status: 404 });
    }
  } catch (error) {
    console.error('Error processing cover request:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 