# Changelog
Tous les changements notables de ce projet seront documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.12] - 2024-03-16

### Modifié
- Suppression de l'affichage du temps restant pour une interface plus épurée
- Retrait de la section "À suivre" pour un design minimaliste
- Conservation de la logique sous-jacente pour de futures fonctionnalités

## [0.2.11] - 2024-03-16

### Modifié
- Suppression de la mention "Radio en direct" du footer pour un design plus épuré

## [0.2.10] - 2024-03-16

### Corrigé
- Correction du bug de reprise automatique de la lecture après mise en pause
- Respect de l'état de pause local lors des synchronisations avec le serveur
- Amélioration de la gestion des états de lecture/pause

## [0.2.9] - 2024-03-16

### Corrigé
- Correction du bug de saut audio toutes les 10 secondes
- Amélioration de la synchronisation entre le serveur et les clients
- Optimisation des transitions entre les morceaux
- Affichage du temps restant pour chaque piste

### Modifié
- Refonte de la gestion des pistes côté serveur
- Amélioration de la gestion du cycle de vie de l'élément audio
- Réduction des rechargements inutiles du lecteur audio 

## [0.2.8] - 2024-03-16

### Ajouté
- Transformation en véritable radio avec flux continu
- Synchronisation du lecteur avec l'état global du serveur
- Affichage des prochains morceaux à venir
- Expérience d'écoute partagée pour tous les utilisateurs

### Modifié
- Architecture repensée avec un état global côté serveur
- Lecture audio synchronisée avec le serveur
- Interface mise à jour pour refléter l'expérience radio 

## [0.2.7] - 2024-03-16

### Ajouté
- Nouvelle interface utilisateur inspirée de Matrix avec image de fond
- Police monospace Space Mono pour un style futuriste
- Affichage des métadonnées sur une seule ligne (Artiste - Titre)

### Modifié
- Refonte complète du design avec bandes noires en haut et en bas
- Simplification du contrôle de volume
- Changement du nom en "jon sound library"
- Bouton play/pause vert sans fond pour un look minimaliste

### Corrigé
- Correction définitive du bug d'attribut src vide dans l'élément audio
- Optimisation du rendu conditionnel de l'élément audio

## [0.2.6] - 2024-03-16

### Corrigé
- Correction de l'enchaînement automatique des morceaux
- Amélioration de la gestion de l'élément audio pour assurer la lecture continue
- Optimisation du cycle de vie des composants audio

## [0.2.5] - 2024-03-16

### Corrigé
- Correction du bug de l'attribut `src` vide dans le composant `MainLayout`

## [0.2.4] - 2024-03-16

### Modifié
- Migration complète de la route `/api/cover/[filename]` vers Cloudinary
- Suppression de l'accès aux fichiers locaux pour les pochettes
- Redirection directe vers les URLs Cloudinary pour les images

### Corrigé
- Correction des erreurs 404 sur les pochettes d'albums
- Amélioration de la gestion des erreurs pour les images manquantes
- Optimisation des performances de chargement des images

## [0.2.3] - 2024-03-16

### Corrigé
- Correction de l'affichage des pochettes d'albums
- Standardisation de l'utilisation de `coverUrl` dans toute l'application
- Correction des problèmes de propriétés dans les composants `Track` et `SimplePlayer`
- Amélioration de la gestion des images dans le layout principal

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

## [0.2.13] - 2024-03-17

### Corrigé
- Correction du problème de synchronisation audio en production
- Implémentation d'un stockage d'état persistant avec Vercel KV
- Uniformisation de l'expérience entre environnement local et production

### Ajouté
- Support pour Vercel KV comme source de vérité pour l'état de la radio
- Gestion améliorée des transitions entre morceaux

### Modifié
- Refonte de la gestion des pistes côté serveur
- Amélioration de la gestion du cycle de vie de l'élément audio
- Réduction des rechargements inutiles du lecteur audio 