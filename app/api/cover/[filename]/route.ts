import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import * as mm from 'music-metadata';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = decodeURIComponent(params.filename);
    const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
    
    const buffer = await readFile(filePath);
    const metadata = await mm.parseBuffer(buffer);
    
    const picture = metadata.common.picture?.[0];
    if (!picture) {
      return new NextResponse('No cover art found', { status: 404 });
    }

    return new NextResponse(picture.data, {
      headers: {
        'Content-Type': picture.format,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la pochette:', error);
    return new NextResponse('Error fetching cover art', { status: 500 });
  }
} 