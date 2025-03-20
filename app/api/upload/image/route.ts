import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convertir le fichier en base64
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataURI = `data:${file.type};base64,${base64}`;

    // Obtenir le nom du fichier sans extension
    const filename = file.name.replace(/\.[^/.]+$/, "");

    // Upload vers Cloudinary avec transformation pour assurer un format carré
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'web-radio/covers',
      public_id: filename,
      use_filename: true,
      unique_filename: true,
      transformation: [
        { width: 800, height: 800, crop: 'fill', gravity: 'center' }
      ]
    });

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
} 