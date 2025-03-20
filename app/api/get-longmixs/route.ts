import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Types pour Cloudinary
interface CloudinaryResource {
  asset_id: string;
  public_id: string;
  resource_type: string;
  format: string;
  secure_url: string;
  duration?: number;
  tags?: string[];
}

export async function GET() {
  try {
    console.log('Cloudinary Config:', {
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      hasApiKey: !!process.env.CLOUDINARY_API_KEY,
      hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
    });

    console.log('Fetching resources from Cloudinary...');
    const result = await cloudinary.search
      .expression('folder:web-radio/longmixs/*')
      .with_field('context')
      .with_field('tags')
      .max_results(500)
      .execute();
    
    console.log('Resources fetched successfully');
    console.log('Number of resources:', result.resources?.length || 0);
    
    // Séparer les MP3 des images
    const audioFiles = result.resources.filter((r: CloudinaryResource) => r.resource_type === 'video' && r.format === 'mp3');
    const imageFiles = result.resources.filter((r: CloudinaryResource) => r.resource_type === 'image');
    
    // Associer chaque MP3 à son image de couverture correspondante
    const mixes = audioFiles.map((audio: CloudinaryResource) => {
      // On récupère la partie du nom avant le underscore pour faire correspondre les images
      const baseTitle = audio.public_id.split('/').pop()?.split('_')[0] || '';
      
      // On cherche une image correspondante
      const coverImage = imageFiles.find((img: CloudinaryResource) => {
        const imgName = img.public_id.split('/').pop()?.split('_')[0] || '';
        return imgName === baseTitle;
      });
      
      return {
        id: audio.public_id,
        title: baseTitle || 'Unknown Title',
        artist: 'JON',
        duration: audio.duration || 0,
        coverUrl: coverImage ? coverImage.secure_url : null,
        mixUrl: audio.secure_url,
        cloudinaryPublicId: audio.public_id,
        cloudinaryCoverId: coverImage ? coverImage.public_id : null,
        tags: audio.tags ? audio.tags.map((tag: string) => ({ id: tag, name: tag })) : []
      };
    });
    
    return NextResponse.json({ resources: mixes });
  } catch (error: any) {
    console.error('Error fetching resources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resources', details: error.message },
      { status: 500 }
    );
  }
} 