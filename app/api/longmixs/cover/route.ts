import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { kv } from '@vercel/kv';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MIX_PREFIX = 'longmix:';

export async function POST(request: NextRequest) {
  console.log('[Cover Upload] Starting cover upload process');
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const mixId = formData.get('mixId') as string;
    
    console.log('[Cover Upload] File received:', file?.name);
    console.log('[Cover Upload] Mix ID:', mixId);
    
    if (!file) {
      console.log('[Cover Upload] No file provided');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!mixId) {
      console.log('[Cover Upload] No mix ID provided');
      return NextResponse.json(
        { error: 'No mix ID provided' },
        { status: 400 }
      );
    }

    // Récupérer le mix existant
    const mixJson = await kv.get(`${MIX_PREFIX}${mixId}`);
    if (!mixJson) {
      console.log('[Cover Upload] Mix not found:', mixId);
      return NextResponse.json(
        { error: 'Mix not found' },
        { status: 404 }
      );
    }

    // Parser le JSON si c'est une chaîne
    const mix = typeof mixJson === 'string' ? JSON.parse(mixJson) : mixJson;
    
    console.log('[Cover Upload] Converting file to base64');
    // Convertir le fichier en base64
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataURI = `data:${file.type};base64,${base64}`;

    console.log('[Cover Upload] Starting Cloudinary upload');
    // Upload vers Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'web-radio/covers',
      public_id: `cover-${mixId}`,
      overwrite: true,
      resource_type: 'image',
      transformation: [
        { width: 500, height: 500, crop: 'fill' }  // Image carrée 500x500
      ]
    });

    console.log('[Cover Upload] Cloudinary upload successful:', result.public_id);

    // Mettre à jour le mix avec l'URL de couverture
    mix.coverUrl = result.secure_url;
    mix.updatedAt = new Date().toISOString();

    // Sauvegarder le mix mis à jour
    console.log('[Cover Upload] Updating mix with cover URL');
    await kv.set(`${MIX_PREFIX}${mixId}`, JSON.stringify(mix));

    console.log('[Cover Upload] Sending response');
    return NextResponse.json({
      success: true,
      coverUrl: result.secure_url,
      mix
    });

  } catch (error: any) {
    console.error('[Cover Upload] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
} 