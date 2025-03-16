# Web Radio - Documentation v0.2.0

## Nouveautés

Cette version ajoute l'enrichissement automatique des métadonnées via l'API Discogs :

### Enrichissement des Métadonnées
- Intégration avec l'API Discogs
- Interface de recherche intuitive
- Sélection parmi les résultats proposés
- Mise à jour automatique des tags ID3
- Récupération des pochettes d'albums

### Configuration Discogs
- Support des clés d'API Discogs
- Variables d'environnement sécurisées
- Documentation de configuration

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
- Support des formats : .mp3, .wav, .ogg, .m4a
- Validation des types de fichiers
- Extraction automatique des métadonnées
- Enrichissement via Discogs
- Gestion des métadonnées existantes

### 4. API
- `/api/upload` : Gestion des uploads de fichiers
- `/api/tracks` : Liste des pistes avec métadonnées
- `/api/cover/[filename]` : Récupération des pochettes
- `/api/enrich` : Enrichissement des métadonnées
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

## Utilisation de l'Enrichissement

1. Accéder à l'interface d'administration
2. Sélectionner un fichier audio
3. Utiliser la recherche Discogs
4. Sélectionner le résultat correspondant
5. Les métadonnées sont automatiquement mises à jour

## Points d'Amélioration Prévus
1. Authentification administrateur
2. Gestion de playlist
3. Streaming optimisé
4. Interface de gestion des fichiers
5. Analytics d'écoute
6. Support des formats de métadonnées additionnels
7. Amélioration de la correspondance des résultats Discogs 