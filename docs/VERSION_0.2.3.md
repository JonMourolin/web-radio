# Version 0.2.3

Cette version se concentre sur la correction des problèmes d'affichage des pochettes d'albums et la standardisation des propriétés liées aux images dans l'application.

## Changements Majeurs

### 1. Standardisation des Propriétés d'Images
- Utilisation uniforme de `coverUrl` dans toute l'application
- Suppression des références obsolètes à `coverPath`
- Mise à jour des interfaces TypeScript pour refléter ces changements

### 2. Corrections d'Affichage
- Correction de l'affichage des pochettes dans le lecteur principal
- Amélioration de la gestion des images dans le composant `SimplePlayer`
- Optimisation du chargement des images dans le layout principal

## Configuration Requise
- Next.js 15.2.2
- React 19.0.0
- Cloudinary (configuration inchangée)
- Discogs API (configuration inchangée)

## Migration depuis 0.2.2
1. Mettre à jour le code avec les derniers changements
2. Vérifier que toutes les références aux images utilisent `coverUrl`
3. Redémarrer l'application

## Problèmes Résolus
- Incohérences dans les noms de propriétés des images
- Problèmes d'affichage des pochettes d'albums
- Erreurs de typage dans les composants utilisant les images

## Notes de Développement
- Les changements sont rétrocompatibles avec les versions précédentes
- Aucune modification de la base de données ou des fichiers existants n'est nécessaire
- Les performances d'affichage des images devraient être améliorées 