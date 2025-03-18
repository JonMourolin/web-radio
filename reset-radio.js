#!/usr/bin/env node

/**
 * Script simple pour réinitialiser l'état de la radio
 * Usage: node reset-radio.js
 */

// Pour la compatibilité avec Node.js < 18
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function resetRadioState() {
  try {
    console.log('Tentative de réinitialisation de l\'état de la radio...');
    
    // Appeler l'API de réinitialisation
    const response = await fetch('http://localhost:3005/api/reset-radio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Réponse du serveur:', data);
    
    if (data.success) {
      console.log('✅ État de la radio réinitialisé avec succès !');
      console.log('Nouvelles informations:');
      console.log('- Piste actuelle:', data.newState.currentTrack?.title);
      console.log('- Artiste:', data.newState.currentTrack?.artist);
      console.log('- Nombre total de pistes:', data.newState.tracks?.length);
    } else {
      console.error('❌ Échec de la réinitialisation:', data.message);
    }
  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation de l\'état de la radio:', error.message);
    console.log('');
    console.log('Assurez-vous que:');
    console.log('1. L\'application Next.js est en cours d\'exécution sur le port 3005');
    console.log('2. L\'API /api/reset-radio est disponible');
    console.log('');
    console.log('Si besoin, démarrez l\'application avec: npm run dev');
  }
}

// Exécuter la fonction
resetRadioState(); 