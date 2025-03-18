# Web Radio v0.3.1

Cette version apporte une simplification majeure de l'architecture tout en préservant les fonctionnalités principales.

## Simplification de l'architecture

Dans la version 0.3.1, nous avons considérablement simplifié l'architecture du projet en :

- **Supprimant le serveur de streaming dédié** : Plus besoin d'installer et de configurer un serveur externe
- **Utilisant directement Cloudinary** : La lecture audio se fait directement depuis Cloudinary
- **Simplifiant le déploiement** : Une seule application à déployer sur Vercel

Cette approche offre plusieurs avantages :
- Configuration plus simple
- Moins de dépendances
- Déploiement plus rapide et plus facile
- Maintenance réduite

## Modification du composant StreamPlayer

Le composant StreamPlayer a été remanié pour :
- Se connecter directement à l'API Next.js existante
- Récupérer les informations sur les pistes en cours depuis l'API interne
- Lire les fichiers audio directement depuis Cloudinary
- Synchroniser l'état de lecture entre les utilisateurs via Redis

## Installation

L'installation est désormais plus simple :

1. Cloner le repository
2. Installer les dépendances avec `npm install`
3. Configurer les variables d'environnement pour Cloudinary et Redis
4. C'est tout !

## Variables d'environnement

Les variables d'environnement nécessaires sont :
```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
KV_REST_API_URL=your_upstash_redis_url
KV_REST_API_TOKEN=your_upstash_redis_token
```

## Déploiement sur Vercel

Le déploiement est simplifié :
1. Connecter votre repository GitHub à Vercel
2. Configurer les variables d'environnement dans le dashboard Vercel
3. Déployer

Aucune configuration supplémentaire n'est nécessaire !

## Fonctionnement interne

L'application continue de fonctionner comme une vraie radio, avec :
- Une synchronisation entre tous les auditeurs
- Une gestion des transitions entre les pistes
- Un affichage des informations sur la piste en cours
- Une prévisualisation des pistes à venir

La différence principale est que la gestion du streaming se fait maintenant directement dans l'application Next.js, sans serveur externe. 