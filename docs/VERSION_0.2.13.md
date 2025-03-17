# Version 0.2.13

## Résumé

Cette version apporte une amélioration majeure à l'architecture de l'application en remplaçant le système de stockage d'état en mémoire par une solution persistante avec Vercel KV (Redis). Cette modification permet de résoudre le problème de synchronisation audio entre les différents environnements et d'offrir une véritable expérience radio partagée.

## Changements

### Correction de bugs

- Résolution du problème de synchronisation audio en production
- Uniformisation de l'expérience entre les environnements de développement local et de production
- Élimination des différences de lecture entre les utilisateurs

### Améliorations techniques

- Implémentation d'un stockage d'état persistant avec Vercel KV (Upstash Redis)
- Refonte de la logique de gestion de l'état de la radio
- Adaptation du code pour une architecture serverless
- Optimisation des transitions entre morceaux

### Nouvelles fonctionnalités

- Véritable expérience de radio partagée pour tous les auditeurs
- Tous les utilisateurs entendent le même morceau au même moment, peu importe quand ils rejoignent
- État global de la radio maintenu entre les redémarrages du serveur

## Détails d'implémentation

- Migration depuis un singleton en mémoire vers un stockage KV
- Utilisation de Vercel KV (alimenté par Upstash) pour une solution sans configuration supplémentaire
- Optimisation des fonctions serverless avec des timeouts appropriés
- Gestion améliorée des erreurs et des cas limites

## Compatibilité

Cette mise à jour est entièrement compatible avec les versions précédentes de l'interface utilisateur. Aucune modification n'est nécessaire du côté client. 