# Changelog
Tous les changements notables de ce projet seront documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.4] - 2025-03-20

### Amélioré
- Augmentation des limites d'upload de fichiers de 100MB à 500MB
- Configuration optimisée pour la gestion des fichiers audio volumineux
- Ajustement des paramètres de mémoire pour les fonctions serverless
- Amélioration des timeouts pour permettre l'upload de longs mixs

## [0.3.3] - 2025-03-20

### Modifié
- Refonte complète de l'interface des Long Mixes avec un design plus épuré et moderne
- Nouvelles vignettes carrées avec contour vert uniquement autour de l'image
- Ajout d'un effet noir et blanc sur les images qui se colorisent au survol
- Simplification des informations affichées (suppression de l'artiste et des détails techniques)
- Intégration du bouton "Écouter" directement sur l'image pour une meilleure ergonomie
- Amélioration de l'espacement et de l'alignement des éléments pour une présentation plus harmonieuse

## [0.3.2] - 2025-03-19

### Ajouté
- Page de Long Mixs avec mise à jour des images depuis Cloudinary
- Intégration de couvertures d'images pour les trois mixs (Deep House Journey, Ambient Voyage, Electronic Fusion)
- Interface améliorée pour la visualisation des Long Mixs

### Modifié
- Optimisation du chargement des images Cloudinary
- Descriptions des mixs plus concises et informatives

## [0.3.1] - 2025-03-19

### Modifié
- Simplification majeure de l'architecture de streaming
- Suppression de la dépendance sur un serveur de streaming externe
- Utilisation directe de Cloudinary pour le streaming audio
- Refonte du composant StreamPlayer pour se connecter à l'API Next.js existante
- Amélioration de la configuration de déploiement Vercel

### Supprimé
- Scripts de serveur de streaming externe
- Dépendances liées à FFmpeg
- Configuration du serveur de streaming externe

## [0.3.0] - 2025-03-18

### Ajouté
- Serveur de streaming audio avec intégration FFmpeg
- Nouveau composant `StreamPlayer` pour écouter en synchronisation
- Traitement audio côté serveur avec FFmpeg
- Algorithme intelligent de rotation de playlist pour éviter les pistes répétitives
- Script de configuration pour le serveur de streaming
- API d'état pour le serveur de streaming
- Documentation pour la configuration et l'utilisation du serveur de streaming

### Modifié
- Amélioration de l'expérience de lecture audio avec la technologie de streaming véritable
- Interface utilisateur du lecteur améliorée avec prévision des pistes à venir
- Mise à jour du README avec les instructions d'installation et d'utilisation
- Changements architecturaux pour supporter le streaming côté serveur

### Corrigé
- Problèmes de lecture audio lors de la connexion de plusieurs utilisateurs
- Transitions de piste incohérentes
- Compatibilité navigateur avec la lecture audio

## [0.2.33] - 2025-03-15

### Ajouté
- Outil de test de connectivité Redis
- Amélioration de la gestion des erreurs pour les téléchargements

### Corrigé
- Problèmes de mise en page sur les appareils mobiles
- Affichage des métadonnées pour certains cas limites

## [0.2.14] - 2025-03-01

### Ajouté
- Première version publique
- Interface utilisateur inspirée de Matrix
- Intégration Cloudinary pour le stockage audio
- Lecteur audio de base
- Affichage des métadonnées de piste
- Design responsive mobile

## [0.2.31] - 2025-03-19

### Corrigé
- Suppression des "corrections" de date qui causaient des problèmes en 2025
- Correction de la logique de vérification des dates pour éviter les ajustements inutiles
- Maintien de la correction uniquement pour les dates réellement dans le futur
- Amélioration des messages de log pour une meilleure clarté diagnostique

## [0.2.30] - 2024-03-19

### Corrigé
- Refonte complète du système de gestion audio pour résoudre définitivement le problème de redémarrage constant
- Séparation claire entre initialisation, changement de piste et ajustement de position
- Augmentation des seuils de tolérance (20 secondes pour les dérives, 30 secondes entre les ajustements)
- Ajout de logs détaillés avec étiquettes (FIRST LOAD, TRACK CHANGE, POSITION ADJUSTMENT)
- Ajout d'événements audio supplémentaires pour un meilleur diagnostic (onwaiting, oncanplay)
- Rallongement des délais entre les mises à jour d'état (15 secondes au lieu de 10)

## [0.2.29] - 2024-03-19

### Corrigé
- Correction critique du problème de redémarrage constant du son
- Amélioration de la détection des changements de piste pour éviter les faux positifs
- Comparaison des URLs audio en plus des identifiants de piste pour une meilleure fiabilité
- Augmentation des seuils de tolérance pour les corrections de position (15 secondes)
- Augmentation du délai entre les ajustements de position (20 secondes minimum)

## [0.2.28] - 2024-03-19

### Amélioré
- Optimisation majeure de la gestion audio pour éviter les sauts et coupures
- Mise en tampon (buffering) des pistes audio avant lecture pour une meilleure stabilité
- Réduction des changements de position trop fréquents
- Meilleure gestion des transitions entre les pistes

### Corrigé
- Résolution du problème de sauts audio et retours au début
- Correction des erreurs lors du chargement des métadonnées audio
- Prévention des erreurs de position négative

## [0.2.27] - 2024-03-19

### Amélioré
- Correction du problème de lecture en boucle apparente des morceaux
- Amélioration de la détection des changements de pistes
- Vérification de l'avancement des pistes toutes les 5 secondes au lieu de 30
- Ajout d'outils de diagnostic pour l'état de la radio (accessibles via la console)

### Corrigé
- Correction des erreurs de date de serveur dans le futur (2025)
- Gestion améliorée des timeouts Redis
- Meilleure détection des changements de pistes

## [0.2.26] - 2024-03-19

### Amélioré
- Optimisation du header pour éviter son rechargement lors de la navigation
- Utilisation de requestAnimationFrame pour une mise à jour fluide de l'interface
- Implémentation d'un SharedLayout pour une meilleure cohérence entre les pages

### Corrigé
- Suppression de l'effet disgracieux où le bouton play/pause change d'état lors de la navigation
- Maintien des métadonnées du morceau en cours pendant la navigation entre pages

## [0.2.25] - 2024-03-19

### Amélioré
- Uniformisation du header entre les pages Radio et Long Mixs
- Affichage du contrôle de lecture et des métadonnées sur toutes les pages
- Expérience utilisateur plus cohérente lors de la navigation entre les sections

## [0.2.24] - 2024-03-19

### Amélioré
- Endpoint `/api/reset-radio` utilise désormais les pistes Cloudinary plutôt que des pistes par défaut
- Amélioration du script `scripts/reset-radio.js` avec un affichage plus informatif
- Diagnostic plus complet de l'état de la radio avant réinitialisation

### Corrigé
- Approche plus directe pour gérer les états Redis corrompus (réinitialisation plutôt que fallback)

## [0.2.23] - 2024-03-19

### Ajouté
- Endpoint `/api/reset-radio` pour diagnostiquer et réinitialiser l'état de la radio
- Script `scripts/reset-radio.js` pour faciliter la réinitialisation de l'état radio
- Pistes par défaut pour assurer le bon fonctionnement même sans pistes utilisateur

### Corrigé
- Robustesse améliorée face aux états Redis invalides ou manquants
- Gestion des erreurs dans l'API `/api/stream` avec états de secours
- Prévention des erreurs "tracks manquants ou index invalide"

## [0.2.22] - 2024-03-19

### Ajouté
- Mise en place d'un player audio global persistant à travers toutes les pages
- Continuité de la lecture lors de la navigation entre sections
- Communication entre les composants via l'objet global window.radioPlayer

### Corrigé
- Gestion des erreurs dans l'API /api/stream lorsque state.tracks est undefined
- Renforcement de la robustesse de l'application en cas d'absence de pistes

## [0.2.21] - 2024-03-19

### Amélioré
- Création de composants réutilisables Header et Footer
- Refactorisation pour partager l'interface commune entre toutes les pages
- Meilleure cohérence visuelle et expérience utilisateur entre les différentes sections

## [0.2.20] - 2024-03-19

### Modifié
- Suppression de la page "Playlist" et de son entrée dans la navigation
- Simplification de l'interface avec uniquement les sections Radio et Long Mixs

## [0.2.19] - 2024-03-19

### Ajouté
- Nouvelle page "Playlist" avec affichage tabulaire des morceaux
- Menu de navigation amélioré avec plusieurs sections (Radio, Long Mixs, Playlist)
- Intégration cohérente de la navigation sur toutes les pages de l'application

## [0.2.18] - 2024-03-19

### Ajouté
- Nouvelle page "Long Mixs" accessible depuis le header

### Corrigé
- Résolution du problème de coupure des morceaux avant leur fin
- Ajout d'une marge de tolérance de 2 secondes pour la transition entre les pistes
- Amélioration de la fluidité des transitions entre les morceaux

## [0.2.17] - 2024-03-19

### Corrigé
- Résolution du bug où le morceau démarrait brièvement au début avant de se repositionner
- Amélioration de l'initialisation du lecteur audio pour rejoindre directement le flux à la bonne position
- Optimisation du cycle de vie du lecteur audio

## [0.2.16] - 2024-03-19

### Ajouté
- Fonctionnalité permettant de rejoindre le flux radio en cours de lecture plutôt qu'au début du morceau
- Synchronisation complète pour les nouveaux auditeurs qui rejoignent le stream

### Corrigé
- Amélioration de l'expérience utilisateur pour les nouveaux auditeurs
- Comportement plus cohérent lors du premier chargement de la radio

## [0.2.15] - 2024-03-19

### Corrigé
- Résolution du problème de changement de morceau à chaque rafraîchissement de page
- Optimisation de la vérification de l'avancement des pistes avec intervalle minimal
- Prévention des requêtes trop fréquentes pour l'avancement des pistes
- Correction du comportement de synchronisation entre clients

### Modifié
- Amélioration des en-têtes HTTP pour éviter la mise en cache côté navigateur
- Optimisation de la gestion des vérifications d'état dans API routes
- Amélioration de la journalisation avec information détaillée sur les vérifications

## [0.2.14] - 2024-03-18

### Ajouté
- Endpoint `/api/env-check` pour le diagnostic des variables d'environnement
- Endpoint `/api/redis-test` pour tester la connexion Redis

### Corrigé
- Amélioration de la connexion Redis en utilisant une configuration directe
- Mise à jour des clés Redis pour éviter les problèmes de cache
- Résolution des problèmes de connectivité avec Upstash Redis sur Vercel

### Modifié
- Utilisation explicite des variables d'environnement Redis_API_URL et Redis_API_TOKEN
- Amélioration de la gestion des erreurs et de la journalisation (logging)

## [0.2.13] - 2024-03-17

### Ajouté
- Intégration avec Upstash Redis via le SDK officiel
- Synchronisation du flux audio pour tous les utilisateurs
- Expérience radio partagée avec transitions de pistes simultanées
- Mécanisme de fallback pour le développement local

### Corrigé
- Problème de synchronisation audio en production
- Uniformisation de l'expérience entre environnement local et production

### Modifié
- Refonte de la gestion d'état avec stockage persistant via Redis
- Migration de @vercel/kv vers @upstash/redis pour une meilleure compatibilité

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

## 0.2.33 (2024-09-10)

### 🔧 Corrections

- **Bouton Play** : Correction du bouton play qui ne fonctionnait plus en production et en local
  - Ajout de l'initialisation manquante de l'élément audio dans le GlobalPlayer
  - Amélioration de la gestion du cycle de vie de l'audio

## 0.2.32 (2024-09-09)

### 🚀 Améliorations Majeures

- **Gestion audio** : Implémentation d'une architecture client-serveur pour la détection de fin de piste
  - Le client (navigateur) détecte maintenant naturellement la fin d'une piste et en informe le serveur
  - Ajout d'une API dédiée pour la notification de fin de piste depuis le client
  - Réduction de l'agressivité des changements automatiques côté serveur
  - Meilleure tolérance pour les pistes longues (>5 minutes) avec une marge supplémentaire
  - Détection et résolution des désynchronisations entre la position client et serveur

### 🔧 Corrections

- **Changement de piste** : Correction des problèmes de sauts et retours au début des pistes
  - Détection plus précise des fins de piste basée sur l'événement `ended` de l'API Audio
  - Vérification supplémentaire du temps restant avant notification
  - Mécanisme pour éviter les notifications en double

### 📊 Diagnostics

- **Outils de débogage** : Amélioration des fonctions de diagnostic 
  - Affichage formaté des états audio avec `console.table`
  - Détails supplémentaires sur l'état de fin de piste et les notifications
  - Logs enrichis pour suivre les désynchronisations client-serveur

## [0.3.5] - 2024-03-20

### Corrigé
- Amélioration de la gestion des erreurs lors de l'upload des longs mixs
- Meilleure gestion des réponses JSON dans l'interface d'upload
- Ajout de logs détaillés pour le diagnostic des problèmes d'upload
- Correction du bug "Unexpected token R" lors de l'upload des fichiers

## [0.3.7] - 2024-03-20

### Modifié
- Refonte de la gestion des Long Mixes avec intégration directe à Cloudinary
- Suppression de la gestion manuelle des uploads pour plus de fiabilité
- Optimisation de la récupération des mixes depuis Cloudinary
- Simplification de l'architecture de gestion des fichiers audio