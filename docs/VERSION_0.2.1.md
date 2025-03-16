# Web Radio - Documentation v0.2.1

## Nouveautés

Cette version ajoute l'enrichissement automatique des métadonnées lors de l'upload :

### Enrichissement Automatique
- Recherche automatique sur Discogs lors de l'upload
- Utilisation du premier résultat trouvé
- Mise à jour immédiate des tags ID3
- Conservation de la possibilité d'enrichissement manuel

### Processus d'Enrichissement
1. Upload du fichier
2. Extraction des métadonnées existantes
3. Recherche automatique sur Discogs
4. Application du premier résultat trouvé
5. Possibilité de modification manuelle si nécessaire

## Fonctionnalités Actuelles

### 1. Interface Utilisateur
- Design responsive et moderne
- Affichage des métadonnées
- Player audio minimaliste
- Interface d'enrichissement des métadonnées
- Thème clair avec gradients subtils

### 2. Lecteur Audio
- Contrôles simplifiés
- Gestion du volume
- Lecture automatique de la playlist
- Affichage des informations du morceau
- Support des pochettes d'albums

### 3. Administration
- Interface d'upload de fichiers
- Enrichissement automatique des métadonnées
- Support des formats : .mp3, .wav, .ogg, .m4a
- Validation des types de fichiers
- Possibilité d'enrichissement manuel
- Gestion des métadonnées existantes

### 4. API
- `/api/upload` : Upload et enrichissement automatique
- `/api/tracks` : Liste des pistes avec métadonnées
- `/api/cover/[filename]` : Récupération des pochettes
- `/api/enrich` : Enrichissement manuel des métadonnées
- Intégration Discogs

## Structure du Projet

```
web-radio/
├── app/
│   ├── components/
│   │   ├── SimplePlayer.tsx
│   │   └── MetadataEnricher.tsx
│   ├── services/
│   │   └── discogs.ts
│   ├── types/
│   │   └── track.ts
│   ├── admin/
│   │   └── page.tsx
│   ├── api/
│   │   ├── upload/
│   │   ├── tracks/
│   │   ├── cover/
│   │   └── enrich/
│   └── page.tsx
├── public/
│   ├── uploads/
│   └── images/
├── docs/
└── .env.local
```

## Technologies Utilisées
- Next.js 15.2.2
- React
- TypeScript
- Tailwind CSS
- music-metadata
- node-id3
- disconnect (API Discogs)

## Configuration

1. Créer un compte Discogs
2. Créer une application sur https://www.discogs.com/settings/developers
3. Copier les clés d'API dans `.env.local` :
   ```
   DISCOGS_CONSUMER_KEY=votre_consumer_key
   DISCOGS_CONSUMER_SECRET=votre_consumer_secret
   ```

## Utilisation

1. Accéder à l'interface d'administration
2. Uploader un fichier audio
   - Les métadonnées sont automatiquement enrichies
   - Le premier résultat Discogs est utilisé
3. Si nécessaire, modifier manuellement :
   - Sélectionner le fichier dans la liste
   - Utiliser l'interface d'enrichissement
   - Choisir un autre résultat Discogs

## Points d'Amélioration Prévus
1. Authentification administrateur
2. Gestion de playlist
3. Streaming optimisé
4. Interface de gestion des fichiers
5. Analytics d'écoute
6. Support des formats de métadonnées additionnels
7. Amélioration de la correspondance des résultats Discogs
8. Configuration du comportement d'enrichissement automatique 