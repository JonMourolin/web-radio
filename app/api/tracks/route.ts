import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { deleteAudio } from '@/app/services/cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET() {
  try {
    // Get all resources from the web-radio/tracks folder with their context
    const result = await cloudinary.search
      .expression('folder:web-radio/tracks/*')
      .with_field('context')
      .execute();

    const tracks = result.resources.map((resource: any) => {
      const context = resource.context || {};
      
      return {
        filename: resource.filename,
        title: context.title || resource.filename.split('.')[0],
        artist: context.artist || 'Unknown Artist',
        album: context.album || 'Unknown Album',
        duration: context.duration || 0,
        coverUrl: context.coverUrl || '',
        cloudinaryUrl: resource.secure_url,
        cloudinaryPublicId: resource.public_id,
      };
    });

    return NextResponse.json({ tracks });
  } catch (error) {
    console.error('Error loading tracks:', error);
    return NextResponse.json(
      { error: 'Failed to load tracks' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { publicId } = await request.json();

    if (!publicId) {
      return NextResponse.json(
        { error: 'Public ID is required' },
        { status: 400 }
      );
    }

    // Delete from Cloudinary
    await deleteAudio(publicId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting track:', error);
    return NextResponse.json(
      { error: 'Failed to delete track' },
      { status: 500 }
    );
  }
} 