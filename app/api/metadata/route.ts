import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET() {
  try {
    const result = await cloudinary.search
      .expression('folder:web-radio/tracks/*')
      .with_field('context')
      .execute();

    const metadata = result.resources.reduce((acc: any, resource: any) => {
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
    const { trackId, metadata } = await request.json();

    if (!trackId || !metadata) {
      return NextResponse.json(
        { error: 'trackId and metadata are required' },
        { status: 400 }
      );
    }

    // Update the asset's context in Cloudinary
    await cloudinary.uploader.add_context(
      metadata,
      [trackId],
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