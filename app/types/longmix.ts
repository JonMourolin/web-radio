export interface Tag {
  id: string;
  name: string;
  createdAt: Date;
}

export interface LongMix {
  id: string;
  title: string;
  artist: string;
  description: string;
  duration: number; // en secondes
  coverUrl: string;
  mixUrl: string;
  tags: Tag[];
  cloudinaryPublicId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Type pour la création d'un nouveau mix
export interface CreateLongMixDTO {
  title: string;
  artist: string;
  description: string;
  tags: string[]; // IDs des tags
}

// Type pour la mise à jour d'un mix
export interface UpdateLongMixDTO {
  title?: string;
  artist?: string;
  description?: string;
  tags?: string[]; // IDs des tags
  coverUrl?: string;
} 