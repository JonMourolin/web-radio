# Web Radio - Documentation v0.0.1

## Fonctionnalités Implémentées

### 1. Interface Utilisateur
- Page d'accueil avec design responsive
- Player audio HTML5 intégré
- Interface minimaliste et moderne
- Thème clair avec gradients subtils

### 2. Lecteur Audio
- Lecture des fichiers audio uploadés
- Contrôles de base (play/pause, volume)
- Lecture automatique de la piste suivante
- Affichage du titre en cours de lecture

### 3. Administration
- Interface d'upload de fichiers
- Support des formats : .mp3, .wav, .ogg, .m4a
- Validation des types de fichiers
- Feedback visuel pendant l'upload

### 4. API
- `/api/upload` : Gestion des uploads de fichiers
- `/api/tracks` : Liste des pistes disponibles
- Stockage local dans `/public/uploads`

## Structure du Projet

```
web-radio/
├── app/
│   ├── components/
│   │   └── AudioPlayer.tsx
│   ├── admin/
│   │   └── page.tsx
│   ├── api/
│   │   ├── upload/
│   │   │   └── route.ts
│   │   └── tracks/
│   │       └── route.ts
│   └── page.tsx
├── public/
│   └── uploads/
└── docs/
    └── VERSION_0.0.1.md
```

## Technologies Utilisées
- Next.js 15.2.2
- React
- TypeScript
- Tailwind CSS
- react-h5-audio-player

## Points d'Amélioration Prévus
1. Authentification administrateur
2. Gestion de playlist
3. Métadonnées des fichiers audio
4. Streaming optimisé
5. Interface de gestion des fichiers
6. Analytics d'écoute 