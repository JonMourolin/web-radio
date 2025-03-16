# Version 0.2.2

Cette version apporte des améliorations significatives à la gestion des métadonnées et à l'expérience d'upload.

## Changements majeurs

### Migration vers Cloudinary

- Les métadonnées sont maintenant stockées directement dans Cloudinary
- Suppression du stockage local des métadonnées
- Meilleure scalabilité et persistance des données

### Amélioration de l'interface d'upload

- Ajout d'une barre de progression pendant l'upload
- Affichage du pourcentage de progression
- Messages d'état détaillés (upload en cours, traitement, succès, erreur)
- Rafraîchissement automatique après un upload réussi

### Corrections

- Résolution du problème avec la route `/api/cover/[filename]`
- Amélioration de la gestion des erreurs
- Optimisation des retours visuels

## Configuration requise

### Variables d'environnement

```env
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret
DISCOGS_TOKEN=votre_token_discogs
```

### Dépendances majeures

- Next.js 15.2.2
- React 19.0.0
- Cloudinary 2.6.0
- TypeScript 5.x

## Migration depuis 0.2.1

1. Assurez-vous d'avoir configuré les variables d'environnement Cloudinary
2. Les métadonnées existantes doivent être migrées vers Cloudinary
3. Mettez à jour vos dépendances avec `npm install`

## Nouvelles fonctionnalités

### Stockage Cloudinary

- Les métadonnées sont stockées dans le contexte des assets Cloudinary
- Accès plus rapide et plus fiable aux métadonnées
- Meilleure intégration avec le stockage des fichiers

### Interface d'upload améliorée

- Barre de progression en temps réel
- États visuels clairs :
  - Upload en cours (violet)
  - Succès (vert)
  - Erreur (rouge)
- Messages d'état explicites
- Rafraîchissement automatique de la liste des pistes 