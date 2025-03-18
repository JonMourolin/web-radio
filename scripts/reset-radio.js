#!/usr/bin/env node

/**
 * Script pour réinitialiser l'état de la radio
 * 
 * Ce script peut être exécuté depuis la ligne de commande pour 
 * réinitialiser complètement l'état de la radio dans Redis.
 * 
 * Exécution : node scripts/reset-radio.js [URL_DE_BASE]
 * 
 * Si aucune URL n'est fournie, "http://localhost:3003" sera utilisée par défaut.
 */

// Utiliser le module http natif de Node.js pour éviter les problèmes avec fetch
const http = require('http');
const https = require('https');

// Récupérer l'URL de base depuis les arguments de ligne de commande ou utiliser localhost par défaut
const baseUrl = process.argv[2] || 'http://localhost:3003';
const resetEndpoint = `${baseUrl}/api/reset-radio`;

console.log(`🔄 Réinitialisation de l'état radio sur ${resetEndpoint}...`);

// Fonction utilitaire pour faire une requête HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: JSON.parse(data)
          });
        } catch (err) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Fonction pour effectuer la réinitialisation
async function resetRadioState() {
  try {
    // Obtenir l'état actuel pour diagnostic
    console.log('📊 Récupération du diagnostic...');
    const diagnosticResponse = await makeRequest(resetEndpoint);
    
    if (diagnosticResponse.statusCode !== 200) {
      console.error('❌ Erreur lors du diagnostic:', diagnosticResponse.statusCode);
      console.error(diagnosticResponse.body);
      return;
    }
    
    console.log('📊 Diagnostic de l\'état actuel:');
    
    // Vérifier l'état Redis
    const redisConfig = diagnosticResponse.body.redisConnection;
    console.log('\n🔌 Configuration Redis:');
    console.log(`  URL: ${redisConfig.url}`);
    console.log(`  Token: ${redisConfig.token}`);
    
    // Vérifier la configuration Cloudinary
    const cloudinaryConfig = diagnosticResponse.body.cloudinaryConfig;
    console.log('\n☁️  Configuration Cloudinary:');
    console.log(`  Cloud Name: ${cloudinaryConfig.cloudName}`);
    console.log(`  API Key: ${cloudinaryConfig.apiKey}`);
    console.log(`  API Secret: ${cloudinaryConfig.apiSecret}`);
    
    // Afficher l'état actuel
    if (diagnosticResponse.body.currentState) {
      const currentState = diagnosticResponse.body.currentState;
      console.log('\n🎵 État radio actuel:');
      console.log(`  Pistes: ${currentState.tracks?.length || 0}`);
      console.log(`  Piste actuelle: ${currentState.currentTrackIndex || 0}`);
      if (currentState.currentTrack) {
        console.log(`  En lecture: ${currentState.currentTrack.title} par ${currentState.currentTrack.artist}`);
      }
    } else {
      console.log('\n⚠️  Aucun état radio trouvé dans Redis');
    }
    
    // Effectuer la réinitialisation (POST)
    console.log('\n🔄 Exécution de la réinitialisation...');
    const resetResponse = await makeRequest(resetEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (resetResponse.statusCode !== 200) {
      console.error('❌ Échec de la réinitialisation:', resetResponse.statusCode);
      console.error(resetResponse.body);
      return;
    }
    
    const result = resetResponse.body;
    
    if (result.success) {
      console.log('✅ Réinitialisation réussie!');
      console.log(`📋 Radio réinitialisée avec ${result.trackCount} pistes`);
      if (result.firstTrack) {
        console.log(`🎵 Première piste: ${result.firstTrack.title} par ${result.firstTrack.artist}`);
      }
      console.log('\n🚀 La radio est maintenant prête à fonctionner!');
    } else {
      console.error('❌ Échec de la réinitialisation:', result.error);
      if (result.details) {
        console.error('  Détails:', result.details);
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error.message);
  }
}

// Exécuter la fonction
resetRadioState(); 