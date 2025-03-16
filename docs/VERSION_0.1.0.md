# Web Radio - Documentation v0.1.0

## Nouveautés

Cette version apporte une refonte majeure de l'interface utilisateur et de l'expérience d'écoute :

### Player Audio Simplifié
- Contrôles essentiels uniquement (lecture/pause, volume)
- Interface épurée et moderne
- Lecture automatique de la piste suivante

### Métadonnées des Morceaux
- Affichage du titre
- Nom de l'artiste
- Nom de l'album (si disponible)
- Pochette de l'album
- Image par défaut pour les morceaux sans pochette

### Nouvelles APIs
- Endpoint pour la récupération des métadonnées
- Endpoint pour servir les pochettes d'albums
- Support du cache pour les images

## Fonctionnalités Actuelles

### 1. Interface Utilisateur
- Design responsive et moderne
- Affichage des métadonnées
- Player audio minimaliste
- Thème clair avec gradients subtils

### 2. Lecteur Audio
- Contrôles simplifiés
- Gestion du volume
- Lecture automatique de la playlist
- Affichage des informations du morceau
- Support des pochettes d'albums

### 3. Administration
- Interface d'upload de fichiers
- Support des formats : .mp3, .wav, .ogg, .m4a
- Validation des types de fichiers
- Extraction automatique des métadonnées

### 4. API
- `/api/upload` : Gestion des uploads de fichiers
- `/api/tracks` : Liste des pistes avec métadonnées
- `/api/cover/[filename]` : Récupération des pochettes
- Stockage local dans `/public/uploads`

## Structure du Projet

```
web-radio/
├── app/
│   ├── components/
│   │   └── SimplePlayer.tsx
│   ├── types/
│   │   └── track.ts
│   ├── admin/
│   │   └── page.tsx
│   ├── api/
│   │   ├── upload/
│   │   │   └── route.ts
│   │   ├── tracks/
│   │   │   └── route.ts
│   │   └── cover/
│   │       └── [filename]/
│   │           └── route.ts
│   └── page.tsx
├── public/
│   ├── uploads/
│   └── images/
│       └── default-cover.jpg
└── docs/
    ├── VERSION_0.0.1.md
    ├── VERSION_0.0.2.md
    └── VERSION_0.1.0.md
```

## Technologies Utilisées
- Next.js 15.2.2
- React
- TypeScript
- Tailwind CSS
- music-metadata

## Points d'Amélioration Prévus
1. Authentification administrateur
2. Gestion de playlist
3. Streaming optimisé
4. Interface de gestion des fichiers
5. Analytics d'écoute
6. Support des formats de métadonnées additionnels 