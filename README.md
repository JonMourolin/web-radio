# Web Radio

Application de web radio minimaliste permettant la diffusion de fichiers audio via un player HTML5.

## Version Actuelle : 0.1.0

[Documentation détaillée de la version courante](docs/VERSION_0.1.0.md)
[Journal des modifications](CHANGELOG.md)

## Fonctionnalités

- Player audio minimaliste (play/pause, volume)
- Affichage des métadonnées (titre, artiste, album)
- Support des pochettes d'albums
- Interface d'upload de fichiers
- Lecture automatique de la playlist

## Installation

```bash
# Installation des dépendances
npm install

# Lancement en développement
npm run dev

# Build pour la production
npm run build
npm start
```

## Utilisation

1. Accédez à l'interface d'administration : http://localhost:3000/admin
2. Uploadez vos fichiers audio
3. Écoutez votre web radio : http://localhost:3000

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

## Licence

MIT
