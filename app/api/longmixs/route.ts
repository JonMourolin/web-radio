import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { LongMix, CreateLongMixDTO, UpdateLongMixDTO, Tag } from '@/app/types/longmix';

const MIX_PREFIX = 'longmix:';
const MIXES_SET = 'longmixes';
const TAG_PREFIX = 'tag:';
const TAGS_SET = 'tags';

// GET - Récupérer tous les mixs ou un mix spécifique
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Si un ID est fourni, retourner ce mix spécifique
    if (id) {
      console.log('[LongMix GET] Fetching mix by ID:', id);
      const mixJson = await kv.get(`${MIX_PREFIX}${id}`);
      if (!mixJson) {
        console.log('[LongMix GET] Mix not found:', id);
        return NextResponse.json(
          { error: 'Mix not found' },
          { status: 404 }
        );
      }
      
      // Parser le JSON si c'est une chaîne
      const mix = typeof mixJson === 'string' ? JSON.parse(mixJson) : mixJson;
      return NextResponse.json(mix);
    }

    // Sinon, retourner tous les mixs
    console.log('[LongMix GET] Fetching all mixes');
    const mixIds = await kv.smembers(MIXES_SET);
    console.log('[LongMix GET] Found mix IDs:', mixIds);

    const mixes = await Promise.all(
      mixIds.map(async (id) => {
        const mixJson = await kv.get(`${MIX_PREFIX}${id}`);
        console.log(`[LongMix GET] Mix ${id} (raw):`, mixJson);
        
        // Parser le JSON si c'est une chaîne
        if (mixJson) {
          const mix = typeof mixJson === 'string' ? JSON.parse(mixJson) : mixJson;
          console.log(`[LongMix GET] Mix ${id} (parsed):`, mix);
          return mix;
        }
        return null;
      })
    );

    // Filtrer les mixs null et trier par date de création
    const validMixes = mixes
      .filter(Boolean)
      .sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });

    console.log('[LongMix GET] Returning mixes:', validMixes);
    return NextResponse.json(validMixes);
  } catch (error: any) {
    console.error('[LongMix GET] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch mixes' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau mix
export async function POST(request: NextRequest) {
  try {
    const data: CreateLongMixDTO = await request.json();
    
    // Validation basique
    if (!data.title || !data.artist) {
      return NextResponse.json(
        { error: 'Title and artist are required' },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();
    const now = new Date();

    const mix: LongMix = {
      id,
      title: data.title,
      artist: data.artist,
      description: data.description,
      duration: 0, // Sera mis à jour lors de l'upload du fichier
      coverUrl: '', // Sera mis à jour lors de l'upload de la cover
      mixUrl: '', // Sera mis à jour lors de l'upload du fichier
      tags: [], // Sera mis à jour avec les tags sélectionnés
      cloudinaryPublicId: '', // Sera mis à jour lors de l'upload
      createdAt: now,
      updatedAt: now,
    };

    // Sauvegarder le mix
    await kv.set(`${MIX_PREFIX}${id}`, mix);
    await kv.sadd(MIXES_SET, id);

    return NextResponse.json(mix);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create mix' },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour un mix
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Mix ID is required' },
        { status: 400 }
      );
    }

    // Récupérer le mix existant
    const existingMix = await kv.get(`${MIX_PREFIX}${id}`) as LongMix;
    if (!existingMix) {
      return NextResponse.json(
        { error: 'Mix not found' },
        { status: 404 }
      );
    }

    const updates: UpdateLongMixDTO = await request.json();

    // Si des tags sont fournis, les convertir en objets Tag
    let updatedTags = existingMix.tags;
    if (updates.tags) {
      const allTags = await kv.smembers(TAGS_SET);
      const tagObjects = await Promise.all(
        updates.tags.map(async (tagId) => {
          const tag = await kv.get(`${TAG_PREFIX}${tagId}`);
          return tag;
        })
      );
      updatedTags = tagObjects.filter(Boolean) as Tag[];
    }

    // Mettre à jour le mix en préservant les propriétés requises
    const updatedMix: LongMix = {
      ...existingMix,
      title: updates.title || existingMix.title,
      artist: updates.artist || existingMix.artist,
      description: updates.description || existingMix.description,
      coverUrl: updates.coverUrl || existingMix.coverUrl,
      tags: updatedTags,
      updatedAt: new Date(),
    };

    await kv.set(`${MIX_PREFIX}${id}`, updatedMix);

    return NextResponse.json(updatedMix);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update mix' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un mix
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Mix ID is required' },
        { status: 400 }
      );
    }

    // Récupérer le mix pour avoir l'ID Cloudinary
    const mix = await kv.get(`${MIX_PREFIX}${id}`);
    if (!mix) {
      return NextResponse.json(
        { error: 'Mix not found' },
        { status: 404 }
      );
    }

    // Supprimer le mix de Redis
    await kv.del(`${MIX_PREFIX}${id}`);
    await kv.srem(MIXES_SET, id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete mix' },
      { status: 500 }
    );
  }
} 