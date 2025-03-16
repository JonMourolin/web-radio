# Version 0.2.5

Cette version corrige un bug critique lié à l'attribut `src` vide dans le composant `MainLayout`.

## Changements Majeurs

### 1. Correction de Bug
- Conditionnement du rendu de l'élément `<audio>` pour éviter un `src` vide

## Configuration Requise
- Aucune modification de configuration requise

## Migration depuis 0.2.4
- Aucune action nécessaire

## Problèmes Résolus
- Erreur de chaîne vide passée à l'attribut `src` dans le composant `MainLayout`

## Notes Techniques
- Le composant `<audio>` est maintenant rendu uniquement si `currentTrack.cloudinaryUrl` est défini 