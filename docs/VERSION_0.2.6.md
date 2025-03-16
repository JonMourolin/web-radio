# Version 0.2.6

Cette version corrige un problème critique lié à l'enchaînement automatique des morceaux.

## Changements Majeurs

### 1. Correction de l'enchaînement automatique
- Modification de la gestion de l'élément audio pour assurer la lecture continue
- Implémentation d'un useEffect dédié pour gérer les changements de morceau
- Optimisation du cycle de vie des composants audio

## Configuration Requise
- Aucune modification de configuration requise

## Migration depuis 0.2.5
- Aucune action nécessaire

## Problèmes Résolus
- Les morceaux ne s'enchaînaient pas automatiquement à la fin de la lecture
- L'élément audio était recréé à chaque changement de morceau, interrompant la lecture continue

## Notes Techniques
- L'élément audio est maintenant toujours présent dans le DOM avec une source conditionnelle
- Un useEffect dédié surveille les changements d'index et déclenche la lecture du nouveau morceau
- La déclaration de currentTrack a été déplacée avant son utilisation dans les effets 