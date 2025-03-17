# Version 0.2.14

## Résumé

Cette version améliore la fiabilité et la robustesse de l'intégration Redis introduite dans la version 0.2.13. Elle ajoute également de nouveaux outils de diagnostic pour faciliter le dépannage et la maintenance de l'application en production. Ces améliorations visent à garantir une expérience radio fluide et synchronisée pour tous les utilisateurs, quelles que soient les conditions de déploiement.

## Changements

### Correction de bugs

- Résolution des problèmes de connectivité avec Upstash Redis sur Vercel
- Amélioration de la gestion des erreurs lors des opérations Redis
- Mise à jour des clés Redis pour éviter les problèmes de cache et forcer le rafraîchissement des données

### Améliorations techniques

- Configuration directe de Redis en utilisant explicitement les variables d'environnement disponibles
- Abandon de la méthode `fromEnv()` au profit d'une initialisation manuelle plus fiable
- Amélioration de la journalisation (logging) pour un meilleur diagnostic des problèmes
- Versioning des clés Redis pour faciliter les migrations futures

### Nouvelles fonctionnalités

- Endpoint `/api/env-check` pour visualiser l'état des variables d'environnement (avec masquage des données sensibles)
- Endpoint `/api/redis-test` pour tester directement la connectivité et les opérations Redis
- Logs de diagnostic améliorés pour suivre l'état de la radio en temps réel

## Détails d'implémentation

- Utilisation explicite des variables `KV_REST_API_URL` et `KV_REST_API_TOKEN` pour initialiser la connexion Redis
- Ajout de clés versionnées (`radio:state:v2`, `radio:lastCheck:v2`, `radio:lastRefresh:v2`) pour assurer une migration propre
- Amélioration des messages de journalisation pour faciliter le debugging
- Création d'endpoints dédiés au diagnostic pour simplifier la maintenance

## Compatibilité

Cette mise à jour est entièrement compatible avec la version précédente (0.2.13). Les modifications sont principalement techniques et n'affectent pas l'expérience utilisateur. L'interface utilisateur reste inchangée.

## Notes d'utilisation des outils de diagnostic

### Vérification des variables d'environnement

Accédez à `/api/env-check` pour obtenir un rapport sur toutes les variables d'environnement configurées. Cette route masque partiellement les valeurs sensibles pour des raisons de sécurité.

### Test de connectivité Redis

Visitez `/api/redis-test` pour vérifier la connexion à Redis et tester les opérations de base (lecture/écriture). Cette route incrémente un compteur de test à chaque accès, permettant de confirmer la persistance des données. 