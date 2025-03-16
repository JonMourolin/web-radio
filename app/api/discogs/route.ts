import { NextRequest, NextResponse } from 'next/server';

const DISCOGS_API_URL = 'https://api.discogs.com';
const DISCOGS_KEY = process.env.DISCOGS_CONSUMER_KEY;
const DISCOGS_SECRET = process.env.DISCOGS_CONSUMER_SECRET;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  if (!DISCOGS_KEY || !DISCOGS_SECRET) {
    return NextResponse.json({ error: 'Discogs credentials not configured' }, { status: 500 });
  }

  try {
    const response = await fetch(
      `${DISCOGS_API_URL}/database/search?q=${encodeURIComponent(query)}&type=release&key=${DISCOGS_KEY}&secret=${DISCOGS_SECRET}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from Discogs');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching from Discogs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from Discogs' },
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

    // Here we would typically update the track metadata in our database
    // For now, we'll just return success
    return NextResponse.json({ success: true, trackId, metadata });
  } catch (error) {
    console.error('Error updating metadata:', error);
    return NextResponse.json(
      { error: 'Failed to update metadata' },
      { status: 500 }
    );
  }
} 