# Changelog
Tous les changements notables de ce projet seront documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1] - 2024-03-16

### Ajouté
- Enrichissement automatique des métadonnées lors de l'upload
- Utilisation automatique du premier résultat Discogs
- Conservation de la possibilité d'enrichissement manuel

## [0.2.0] - 2024-03-16

### Ajouté
- Enrichissement automatique des métadonnées via Discogs
- Interface de recherche et sélection des métadonnées
- Mise à jour automatique des tags ID3
- Support des pochettes d'albums depuis Discogs
- Configuration de l'API Discogs
- Continuous random playback of tracks
- Automatic track transition when a song ends
- Shuffle functionality for the playlist
- Improved player interface with modern design
- Volume control with persistent state
- Responsive layout with left content and right player sections

### Modifié
- Interface utilisateur simplifiée et plus moderne
- Suppression des contrôles de navigation dans le morceau

## [0.1.0] - 2024-03-16

### Ajouté
- Nouveau player audio simplifié avec contrôles essentiels
- Affichage des métadonnées des morceaux (titre, artiste, album)
- Support des pochettes d'albums
- API pour la gestion des métadonnées
- API pour servir les pochettes d'albums

### Modifié
- Interface utilisateur simplifiée et plus moderne
- Suppression des contrôles de navigation dans le morceau

### Corrigé
- Gestion améliorée des états vides du player audio
- Ajout d'un message explicite quand aucune piste n'est disponible
- Correction du problème de chaîne vide dans l'attribut src du player

## [0.0.2] - 2024-03-16

### Corrigé
- Gestion améliorée des états vides du player audio
- Ajout d'un message explicite quand aucune piste n'est disponible
- Correction du problème de chaîne vide dans l'attribut src du player

## [0.0.1] - 2024-03-16

### Ajouté
- Configuration initiale du projet Next.js avec TypeScript
- Mise en place du player audio HTML5
- Interface d'upload de fichiers audio
- API pour la gestion des fichiers
- Documentation de base
- Structure du projet
- Configuration Git/GitHub

## [0.2.2] - 2024-03-16

### Ajouté
- Migration complète du stockage des métadonnées vers Cloudinary
- Barre de progression pour l'upload des fichiers
- État détaillé pendant l'upload (pourcentage, message)
- Rafraîchissement automatique après upload réussi

### Modifié
- Suppression du stockage local des métadonnées
- Amélioration de la gestion des erreurs d'upload
- Optimisation de l'interface d'upload avec retours visuels

### Corrigé
- Correction de l'erreur sur la route `/api/cover/[filename]`
- Amélioration de la gestion des états d'upload

## [0.2.3] - 2024-03-16

### Corrigé
- Correction de l'affichage des pochettes d'albums
- Standardisation de l'utilisation de `coverUrl` dans toute l'application
- Correction des problèmes de propriétés dans les composants `Track` et `SimplePlayer`
- Amélioration de la gestion des images dans le layout principal 