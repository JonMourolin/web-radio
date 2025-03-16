import { NextRequest, NextResponse } from 'next/server';
import * as mm from 'music-metadata';
import { uploadAudio } from '@/app/services/cloudinary';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function searchDiscogs(query: string) {
  try {
    const response = await fetch(
      `https://api.discogs.com/database/search?q=${encodeURIComponent(query)}&type=release`,
      {
        headers: {
          'Authorization': `Discogs key=${process.env.DISCOGS_CONSUMER_KEY}, secret=${process.env.DISCOGS_CONSUMER_SECRET}`,
          'User-Agent': 'WebRadio/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Discogs search failed');
    }

    const data = await response.json();
    return data.results?.[0] || null;
  } catch (error) {
    console.error('Error searching Discogs:', error);
    return null;
  }
}

async function updateMetadata(trackId: string, result: any) {
  try {
    const metadata = {
      title: result.title.split(' - ')[1] || result.title,
      artist: result.title.split(' - ')[0],
      album: result.title.split(' - ')[1] || result.title,
      year: result.year,
      coverUrl: result.cover_image,
      updated_at: new Date().toISOString(),
      source: 'discogs'
    };

    // Convert metadata object to Cloudinary context string format
    const contextStr = Object.entries(metadata)
      .map(([key, value]) => `${key}=${value}`)
      .join('|');

    await cloudinary.uploader.add_context(
      contextStr,
      [trackId],
      { resource_type: 'video' }
    );

    return metadata;
  } catch (error) {
    console.error('Error updating metadata:', error);
    return null;
  }
}

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

    // Upload to Cloudinary
    const { url: cloudinaryUrl, publicId: cloudinaryPublicId } = await uploadAudio(file);

    // Parse metadata
    const buffer = await file.arrayBuffer();
    const metadata = await mm.parseBuffer(new Uint8Array(buffer), {
      mimeType: file.type,
      size: file.size,
    });

    // Create track object
    const track = {
      filename: file.name,
      title: metadata.common.title || path.parse(file.name).name,
      artist: metadata.common.artist || 'Unknown Artist',
      album: metadata.common.album || 'Unknown Album',
      duration: metadata.format.duration || 0,
      year: metadata.common.year?.toString(),
      genre: metadata.common.genre?.[0],
      cloudinaryUrl,
      cloudinaryPublicId,
    };

    // Try to find and apply Discogs metadata automatically
    const searchQuery = track.artist !== 'Unknown Artist' 
      ? `${track.artist} - ${track.title}`
      : track.filename;
      
    const discogsResult = await searchDiscogs(searchQuery);
    if (discogsResult) {
      const updatedMetadata = await updateMetadata(cloudinaryPublicId, discogsResult);
      if (updatedMetadata) {
        track.title = updatedMetadata.title;
        track.artist = updatedMetadata.artist;
        track.album = updatedMetadata.album;
        track.year = updatedMetadata.year;
      }
    }

    return NextResponse.json({ track });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Error processing file' },
      { status: 500 }
    );
  }
} 