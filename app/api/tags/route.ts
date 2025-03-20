import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { Tag } from '@/app/types/longmix';

// Préfixe pour les clés Redis des tags
const TAG_PREFIX = 'tag:';
const TAGS_SET = 'tags';

// GET - Récupérer tous les tags
export async function GET() {
  try {
    console.log('[Tags GET] Fetching all tags');
    const tagIds = await kv.smembers(TAGS_SET);
    console.log('[Tags GET] Found tag IDs:', tagIds);

    if (tagIds.length === 0) {
      console.log('[Tags GET] No tags found, returning default tags');
      // Si aucun tag n'existe, retourner une liste par défaut
      const defaultTags = [
        { id: crypto.randomUUID(), name: 'House' },
        { id: crypto.randomUUID(), name: 'Techno' },
        { id: crypto.randomUUID(), name: 'Disco' },
        { id: crypto.randomUUID(), name: 'Ambient' }
      ];

      // Sauvegarder les tags par défaut
      for (const tag of defaultTags) {
        await kv.set(`${TAG_PREFIX}${tag.id}`, JSON.stringify(tag));
        await kv.sadd(TAGS_SET, tag.id);
      }

      return NextResponse.json(defaultTags);
    }

    // Récupérer tous les tags
    const tags = await Promise.all(
      tagIds.map(async (id) => {
        const tagJson = await kv.get(`${TAG_PREFIX}${id}`);
        if (tagJson) {
          return typeof tagJson === 'string' ? JSON.parse(tagJson) : tagJson;
        }
        return null;
      })
    );

    // Filtrer les tags null et trier par nom
    const validTags = tags
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name));

    console.log('[Tags GET] Returning tags:', validTags);
    return NextResponse.json(validTags);
  } catch (error: any) {
    console.error('[Tags GET] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau tag
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validation basique
    if (!data.name) {
      return NextResponse.json(
        { error: 'Tag name is required' },
        { status: 400 }
      );
    }

    const name = data.name.trim();
    
    // Vérifier si le nom du tag existe déjà
    const tagIds = await kv.smembers(TAGS_SET);
    const tags = await Promise.all(
      tagIds.map(async (id) => {
        const tagJson = await kv.get(`${TAG_PREFIX}${id}`);
        return tagJson ? (typeof tagJson === 'string' ? JSON.parse(tagJson) : tagJson) : null;
      })
    );
    
    const existingTag = tags.find(tag => tag && tag.name.toLowerCase() === name.toLowerCase());
    if (existingTag) {
      return NextResponse.json(
        { error: 'Tag already exists', tag: existingTag },
        { status: 409 }
      );
    }

    const id = crypto.randomUUID();
    const tag = {
      id,
      name,
      createdAt: new Date().toISOString()
    };

    // Sauvegarder le tag
    await kv.set(`${TAG_PREFIX}${id}`, JSON.stringify(tag));
    await kv.sadd(TAGS_SET, id);

    return NextResponse.json(tag);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create tag' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un tag
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Tag ID is required' },
        { status: 400 }
      );
    }

    // Récupérer le tag pour vérifier son existence
    const tagJson = await kv.get(`${TAG_PREFIX}${id}`);
    if (!tagJson) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      );
    }

    // Supprimer le tag
    await kv.del(`${TAG_PREFIX}${id}`);
    await kv.srem(TAGS_SET, id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete tag' },
      { status: 500 }
    );
  }
} 