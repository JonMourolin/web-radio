# Version 0.2.8

Cette version transforme l'application en une véritable radio en flux continu, où tous les auditeurs écoutent la même chose au même moment.

## Changements Majeurs

### 1. Flux Radio Continu
- Mise en place d'un serveur de streaming avec état global
- Tous les utilisateurs écoutent le même morceau au même moment
- Synchronisation automatique avec le flux du serveur
- Expérience d'écoute partagée et simultanée

### 2. Affichage des Prochains Morceaux
- Nouvelle section "À suivre" affichant les 3 prochains morceaux
- Prévisualisation de la programmation à venir
- Meilleure expérience utilisateur avec anticipation du contenu

### 3. Architecture Repensée
- État global de la radio géré côté serveur
- Singleton pour maintenir l'état de lecture entre les requêtes
- Synchronisation périodique entre le client et le serveur
- Gestion automatique de la progression et des transitions

## Configuration Requise
- Aucune modification de configuration requise
- Fonctionne avec l'infrastructure Cloudinary existante

## Migration depuis 0.2.7
- Aucune action nécessaire pour les utilisateurs
- Déploiement transparent sans interruption de service

## Notes Techniques
- Utilisation d'un pattern Singleton pour l'état global de la radio
- Polling toutes les 5 secondes pour synchroniser l'état
- Gestion intelligente des transitions entre morceaux
- Optimisation de la synchronisation pour minimiser les décalages 