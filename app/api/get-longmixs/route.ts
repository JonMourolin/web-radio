import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
    console.log('First resource:', result.resources?.[0]);
    
    // Transformer les ressources pour correspondre à la structure attendue
    const transformedResources = result.resources.map(resource => ({
      id: resource.public_id,
      title: resource.filename || 'Unknown Title',
      artist: 'Unknown Artist',
      duration: resource.duration || 0,
      coverUrl: resource.secure_url,
      cloudinaryPublicId: resource.public_id,
      tags: resource.tags ? resource.tags.map(tag => ({ id: tag, name: tag })) : []
    }));
    
    return NextResponse.json({ resources: transformedResources });
  } catch (error: any) {
    console.error('Error fetching resources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resources', details: error.message },
      { status: 500 }
    );
  }
} 