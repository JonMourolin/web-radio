# Web Radio

Application de web radio minimaliste permettant la diffusion de fichiers audio via un player HTML5.

## Version Actuelle : 0.2.1

[Documentation détaillée de la version courante](docs/VERSION_0.2.1.md)
[Journal des modifications](CHANGELOG.md)

## Fonctionnalités

- Player audio minimaliste (play/pause, volume)
- Affichage des métadonnées (titre, artiste, album)
- Support des pochettes d'albums
- Interface d'upload de fichiers
- Lecture automatique de la playlist
- Enrichissement automatique des métadonnées via Discogs
- Possibilité d'enrichissement manuel
- Mise à jour automatique des tags ID3

## Installation

```bash
# Installation des dépendances
npm install

# Configuration
# Créez un fichier .env.local avec vos clés Discogs :
DISCOGS_CONSUMER_KEY=votre_consumer_key
DISCOGS_CONSUMER_SECRET=votre_consumer_secret

# Lancement en développement
npm run dev

# Build pour la production
npm run build
npm start
```

## Utilisation

1. Accédez à l'interface d'administration : http://localhost:3000/admin
2. Uploadez vos fichiers audio (enrichissement automatique via Discogs)
3. Modifiez manuellement les métadonnées si nécessaire
4. Écoutez votre web radio : http://localhost:3000

## Structure des Dossiers

- `/app` : Code source de l'application
- `/public/uploads` : Stockage des fichiers audio
- `/docs` : Documentation technique
- `/public/images` : Assets statiques

## Technologies

- Next.js 15.2.2
- React
- TypeScript
- Tailwind CSS
- music-metadata
- node-id3
- disconnect (API Discogs)

## Licence

MIT
