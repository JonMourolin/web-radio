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
const MIXES_SET = 'longmixes';

// Taille maximale de fichier : 500MB
const MAX_FILE_SIZE = 500 * 1024 * 1024;

export async function POST(request: NextRequest) {
  console.log('[LongMix Upload] Starting upload process');
  
  try {
    let formData;
    try {
      formData = await request.formData();
      console.log('[LongMix Upload] FormData parsed successfully');
    } catch (formError) {
      console.error('[LongMix Upload] Error parsing FormData:', formError);
      return NextResponse.json(
        { error: 'Invalid form data' },
        { status: 400 }
      );
    }

    const file = formData.get('file') as File;
    const tagsJson = formData.get('tags') as string;
    
    console.log('[LongMix Upload] File received:', file?.name);
    console.log('[LongMix Upload] File type:', file?.type);
    console.log('[LongMix Upload] File size:', file?.size ? Math.round(file.size / (1024 * 1024)) + 'MB' : 'unknown');
    console.log('[LongMix Upload] Tags received:', tagsJson);
    
    if (!file) {
      console.log('[LongMix Upload] No file provided');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Vérifier la taille du fichier
    if (file.size > MAX_FILE_SIZE) {
      console.log('[LongMix Upload] File too large:', Math.round(file.size / (1024 * 1024)), 'MB');
      return NextResponse.json(
        { error: `File size exceeds maximum limit of ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB` },
        { status: 413 }
      );
    }

    console.log('[LongMix Upload] Converting file to base64');
    let buffer, base64, dataURI;
    try {
      buffer = await file.arrayBuffer();
      base64 = Buffer.from(buffer).toString('base64');
      dataURI = `data:${file.type};base64,${base64}`;
      console.log('[LongMix Upload] File converted to base64 successfully');
    } catch (conversionError) {
      console.error('[LongMix Upload] Error converting file:', conversionError);
      return NextResponse.json(
        { error: 'Error processing file' },
        { status: 500 }
      );
    }

    // Obtenir le nom du fichier sans extension
    const filename = file.name.replace(/\.[^/.]+$/, "");
    console.log('[LongMix Upload] Filename:', filename);

    console.log('[LongMix Upload] Starting Cloudinary upload');
    let result;
    try {
      result = await cloudinary.uploader.upload(dataURI, {
        resource_type: 'video',
        folder: 'web-radio/longmixs',
        public_id: filename,
        use_filename: true,
        unique_filename: true,
        timeout: 600000,
        chunk_size: 20000000,
      });
      console.log('[LongMix Upload] Cloudinary upload successful:', result.public_id);
    } catch (cloudinaryError: any) {
      console.error('[LongMix Upload] Cloudinary upload error:', cloudinaryError);
      return NextResponse.json(
        { error: cloudinaryError.message || 'Error uploading to cloud storage' },
        { status: 500 }
      );
    }

    // Créer l'objet mix avec les informations de base
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    // Préparer les tags (simples strings) ou tableau vide si aucun tag
    const tags = tagsJson ? JSON.parse(tagsJson) : [];
    const formattedTags = tags.map((tag: string) => ({ 
      id: crypto.randomUUID(),
      name: tag 
    }));
    
    console.log('[LongMix Upload] Formatted tags:', formattedTags);

    const mix = {
      id,
      title: filename,
      artist: 'Unknown Artist',
      description: '',
      cloudinaryPublicId: result.public_id,
      mixUrl: result.secure_url,
      coverUrl: '',
      duration: Math.round(result.duration),
      tags: formattedTags,
      createdAt: now,
      updatedAt: now
    };

    // Sauvegarder le mix dans Vercel KV
    console.log('[LongMix Upload] Saving mix to database:', mix.id);
    console.log('[LongMix Upload] Mix data:', JSON.stringify(mix));
    
    try {
      await kv.set(`${MIX_PREFIX}${id}`, JSON.stringify(mix));
      await kv.sadd(MIXES_SET, id);
      console.log('[LongMix Upload] Mix saved successfully');
    } catch (dbError) {
      console.error('[LongMix Upload] Database error:', dbError);
      throw dbError;
    }

    console.log('[LongMix Upload] Sending response');
    return new NextResponse(JSON.stringify({
      mix,
      success: true
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error: any) {
    console.error('[LongMix Upload] Error:', error);
    return new NextResponse(JSON.stringify({
      error: error.message || 'Upload failed'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

// La configuration de la taille maximale est maintenant gérée par le middleware Next.js 