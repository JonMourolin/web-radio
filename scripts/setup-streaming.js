#!/usr/bin/env node

/**
 * Script d'installation du serveur de streaming
 * 
 * Ce script aide à installer et configurer le serveur de streaming audio
 * pour l'application web-radio.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Messages en couleur
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

// Titre
console.log(`
${colors.bright}${colors.cyan}╔════════════════════════════════════════════╗
║  Configuration du Serveur de Streaming Audio  ║
╚════════════════════════════════════════════╝${colors.reset}
`);

// Vérifier si ffmpeg est installé
console.log(`${colors.bright}1. Vérification de FFmpeg${colors.reset}`);

try {
  execSync('ffmpeg -version', { stdio: 'ignore' });
  console.log(`${colors.green}✓ FFmpeg est déjà installé${colors.reset}`);
} catch (error) {
  console.log(`${colors.yellow}⚠ FFmpeg n'est pas installé ou n'est pas dans le PATH${colors.reset}`);
  console.log(`${colors.cyan}ℹ Installation des dépendances FFmpeg via npm...${colors.reset}`);
  
  try {
    execSync('npm install --save fluent-ffmpeg @ffmpeg-installer/ffmpeg', { stdio: 'inherit' });
    console.log(`${colors.green}✓ Dépendances FFmpeg installées avec succès${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}✗ Erreur lors de l'installation des dépendances FFmpeg${colors.reset}`);
    console.error(error.message);
    process.exit(1);
  }
}

// Créer le dossier tmp s'il n'existe pas
console.log(`\n${colors.bright}2. Création du dossier temporaire${colors.reset}`);
const tmpDir = path.join(__dirname, '../tmp');

if (!fs.existsSync(tmpDir)) {
  try {
    fs.mkdirSync(tmpDir, { recursive: true });
    console.log(`${colors.green}✓ Dossier temporaire créé: ${tmpDir}${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}✗ Erreur lors de la création du dossier temporaire${colors.reset}`);
    console.error(error.message);
  }
} else {
  console.log(`${colors.green}✓ Le dossier temporaire existe déjà${colors.reset}`);
}

// Vérifier les variables d'environnement
console.log(`\n${colors.bright}3. Vérification des variables d'environnement${colors.reset}`);

const envFile = path.join(__dirname, '../.env.local');
let envConfig = {};

// Lire le fichier .env.local s'il existe
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      envConfig[match[1].trim()] = match[2].trim();
    }
  });
}

// Variables requises
const requiredVars = [
  'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'KV_REST_API_URL',
  'KV_REST_API_TOKEN'
];

// Vérifier chaque variable
let missingVars = [];
for (const varName of requiredVars) {
  if (!envConfig[varName]) {
    missingVars.push(varName);
  } else {
    console.log(`${colors.green}✓ ${varName} : Configuré${colors.reset}`);
  }
}

if (missingVars.length > 0) {
  console.log(`\n${colors.yellow}⚠ Variables d'environnement manquantes :${colors.reset}`);
  for (const varName of missingVars) {
    console.log(`  - ${varName}`);
  }
  console.log(`\n${colors.cyan}ℹ Ces variables doivent être définies dans .env.local${colors.reset}`);
} else {
  console.log(`${colors.green}✓ Toutes les variables d'environnement requises sont configurées${colors.reset}`);
}

// Afficher le résumé
console.log(`\n${colors.bright}${colors.cyan}╔════════════════════════════════════════════╗
║                 Résumé                     ║
╚════════════════════════════════════════════╝${colors.reset}`);

console.log(`
${colors.bright}Configuration terminée!${colors.reset}

Pour démarrer le serveur de streaming:
  ${colors.yellow}npm run stream-server${colors.reset}
  
Le serveur sera accessible à:
  ${colors.cyan}http://localhost:8000${colors.reset}
  
API du serveur:
  ${colors.cyan}http://localhost:8000/status${colors.reset} - Informations sur l'état du streaming
  ${colors.cyan}http://localhost:8000/stream${colors.reset} - Flux audio à utiliser dans le lecteur

Le lecteur web est déjà configuré pour se connecter au serveur de streaming.
`);

if (missingVars.length > 0) {
  console.log(`${colors.yellow}⚠ N'oubliez pas de configurer les variables d'environnement manquantes!${colors.reset}`);
}

// Message final
console.log(`${colors.bright}${colors.green}✓ Configuration terminée avec succès!${colors.reset}`);

// Fermer l'interface readline
rl.close(); 