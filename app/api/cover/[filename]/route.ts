import { NextRequest } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configuration de Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    // Attendre que params soit disponible
    const filename = await Promise.resolve(decodeURIComponent(params.filename));
    
    try {
      // Rechercher l'asset sur Cloudinary
      const result = await cloudinary.search
        .expression(`filename:${filename}`)
        .execute();

      if (result.total_count > 0) {
        // Rediriger vers l'URL Cloudinary
        const url = result.resources[0].secure_url;
        return Response.redirect(url);
      }

      // Si l'image n'est pas trouvée sur Cloudinary
      return new Response('Image not found', { status: 404 });
    } catch (error) {
      console.error('Cloudinary error:', error);
      return new Response('Image not found', { status: 404 });
    }
  } catch (error) {
    console.error('Error processing cover request:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 