import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const MIX_PREFIX = 'longmix:';
const TAG_PREFIX = 'tag:';
const TAGS_SET = 'tags';

export async function POST(request: NextRequest) {
  console.log('[Mix Tags Update] Starting tags update process');
  
  try {
    const data = await request.json();
    const { mixId, tagNames } = data;
    
    console.log('[Mix Tags Update] Mix ID:', mixId);
    console.log('[Mix Tags Update] Tag names:', tagNames);
    
    if (!mixId) {
      console.log('[Mix Tags Update] No mix ID provided');
      return NextResponse.json(
        { error: 'No mix ID provided' },
        { status: 400 }
      );
    }

    if (!tagNames || !Array.isArray(tagNames)) {
      console.log('[Mix Tags Update] Invalid tags format');
      return NextResponse.json(
        { error: 'Tags must be an array of strings' },
        { status: 400 }
      );
    }

    // Récupérer le mix existant
    const mixJson = await kv.get(`${MIX_PREFIX}${mixId}`);
    if (!mixJson) {
      console.log('[Mix Tags Update] Mix not found:', mixId);
      return NextResponse.json(
        { error: 'Mix not found' },
        { status: 404 }
      );
    }

    // Parser le JSON si c'est une chaîne
    const mix = typeof mixJson === 'string' ? JSON.parse(mixJson) : mixJson;
    
    // Récupérer tous les tags existants
    const tagIds = await kv.smembers(TAGS_SET);
    const allTags = await Promise.all(
      tagIds.map(async (id) => {
        const tagJson = await kv.get(`${TAG_PREFIX}${id}`);
        return tagJson ? (typeof tagJson === 'string' ? JSON.parse(tagJson) : tagJson) : null;
      })
    );
    const validTags = allTags.filter(Boolean);
    
    // Créer les nouveaux tags qui n'existent pas encore
    const existingTagNames = validTags.map(tag => tag.name.toLowerCase());
    const newTagPromises = tagNames
      .filter(name => !existingTagNames.includes(name.toLowerCase()))
      .map(async (name) => {
        const id = crypto.randomUUID();
        const tag = {
          id,
          name,
          createdAt: new Date().toISOString()
        };
        await kv.set(`${TAG_PREFIX}${id}`, JSON.stringify(tag));
        await kv.sadd(TAGS_SET, id);
        return tag;
      });
    
    const newlyCreatedTags = await Promise.all(newTagPromises);
    
    // Récupérer à nouveau tous les tags (y compris les nouveaux)
    const updatedTagsArray = [...validTags, ...newlyCreatedTags];
    
    // Filtrer pour obtenir uniquement les tags demandés
    const selectedTags = updatedTagsArray
      .filter(tag => tagNames.some(name => name.toLowerCase() === tag.name.toLowerCase()));
    
    console.log('[Mix Tags Update] Selected tags:', selectedTags);
    
    // Mettre à jour le mix avec les nouveaux tags
    mix.tags = selectedTags;
    mix.updatedAt = new Date().toISOString();
    
    // Sauvegarder le mix mis à jour
    console.log('[Mix Tags Update] Updating mix with new tags');
    await kv.set(`${MIX_PREFIX}${mixId}`, JSON.stringify(mix));
    
    console.log('[Mix Tags Update] Sending response');
    return NextResponse.json({
      success: true,
      mix
    });
    
  } catch (error: any) {
    console.error('[Mix Tags Update] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update tags' },
      { status: 500 }
    );
  }
} 