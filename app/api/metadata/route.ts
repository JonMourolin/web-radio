import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface Metadata {
  title?: string;
  artist?: string;
  album?: string;
  year?: string;
  genre?: string;
  coverUrl?: string;
  [key: string]: string | undefined;
}

export async function GET() {
  try {
    const result = await cloudinary.search
      .expression('folder:web-radio/tracks/*')
      .with_field('context')
      .execute();

    const metadata = result.resources.reduce((acc: Record<string, any>, resource: any) => {
      acc[resource.public_id] = resource.context || {};
      return acc;
    }, {});

    return NextResponse.json(metadata);
  } catch (error) {
    console.error('Error loading metadata:', error);
    return NextResponse.json(
      { error: 'Failed to load metadata' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { publicId, metadata }: { publicId: string, metadata: Metadata } = await request.json();

    if (!publicId || !metadata) {
      return NextResponse.json(
        { error: 'publicId and metadata are required' },
        { status: 400 }
      );
    }

    // Convert metadata object to Cloudinary context string format
    const contextStr = Object.entries(metadata)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key}=${value}`)
      .join('|');

    // Update the asset's context in Cloudinary
    await cloudinary.uploader.add_context(
      contextStr,
      [publicId],
      { resource_type: 'video' } // Cloudinary uses 'video' type for audio files
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving metadata:', error);
    return NextResponse.json(
      { error: 'Failed to save metadata' },
      { status: 500 }
    );
  }
} 