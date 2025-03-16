# Version 0.2.7

Cette version introduit une refonte complète de l'interface utilisateur avec un thème inspiré de Matrix et corrige définitivement le bug d'attribut src vide.

## Changements Majeurs

### 1. Nouvelle Interface Utilisateur
- Design inspiré de Matrix avec image de fond et bandes noires
- Police monospace Space Mono pour un style futuriste
- Bouton play/pause vert sans fond pour un look minimaliste
- Contrôle de volume simplifié et toujours visible

### 2. Amélioration de l'Affichage des Métadonnées
- Affichage des métadonnées sur une seule ligne (Artiste - Titre)
- Meilleure utilisation de l'espace dans l'en-tête
- Pochette d'album plus compacte

### 3. Correction du Bug d'Attribut src Vide
- Rendu conditionnel de l'élément audio uniquement lorsque l'URL existe
- Élimination des erreurs de console liées à l'attribut src vide

## Configuration Requise
- Aucune modification de configuration requise

## Migration depuis 0.2.6
- Aucune action nécessaire

## Notes Techniques
- Utilisation de la police Space Mono de Google Fonts
- Optimisation du rendu conditionnel pour éviter les erreurs de console
- Simplification de la structure JSX pour une meilleure maintenabilité 