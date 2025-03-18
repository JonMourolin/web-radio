#!/usr/bin/env node

/**
 * Script intermédiaire pour charger les variables d'environnement
 * avant de démarrer le serveur de streaming
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Fonction pour charger les variables d'environnement à partir de .env.local
function loadEnv() {
  const envFile = path.join(__dirname, '../.env.local');
  
  if (fs.existsSync(envFile)) {
    console.log('📄 Chargement des variables d\'environnement depuis .env.local...');
    const envContent = fs.readFileSync(envFile, 'utf8');
    
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        // Supprimer les guillemets de la valeur si présents
        let value = match[2].trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    });
    
    console.log('✅ Variables d\'environnement chargées avec succès');
  } else {
    console.error('❌ Fichier .env.local non trouvé');
    process.exit(1);
  }
}

// Charger les variables d'environnement
loadEnv();

// Vérifier les variables requises
const requiredVars = [
  'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'KV_REST_API_URL',
  'KV_REST_API_TOKEN'
];

let missingVars = [];
for (const varName of requiredVars) {
  if (!process.env[varName]) {
    missingVars.push(varName);
  }
}

if (missingVars.length > 0) {
  console.error('❌ Variables d\'environnement manquantes:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  process.exit(1);
}

// Afficher les variables d'environnement chargées (sans les valeurs sensibles)
console.log('📋 Variables d\'environnement disponibles:');
requiredVars.forEach(varName => {
  if (process.env[varName]) {
    const value = process.env[varName];
    const maskedValue = varName.includes('KEY') || varName.includes('SECRET') || varName.includes('TOKEN') 
      ? '****' 
      : value;
    console.log(`   - ${varName}: ${maskedValue}`);
  }
});

// Démarrer le serveur de streaming
console.log('🚀 Démarrage du serveur de streaming...');
require('./stream-server.js'); 