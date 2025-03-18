#!/usr/bin/env node

/**
 * Serveur de streaming radio basé sur Node.js
 * 
 * Ce script implémente un serveur de streaming audio qui:
 * 1. Récupère les pistes audio depuis Cloudinary
 * 2. Génère une playlist aléatoire
 * 3. Gère la concaténation des pistes et les transitions
 * 4. Diffuse un flux audio continu accessible via HTTP
 * 
 * Usage: node scripts/stream-server.js [port]
 * Le port par défaut est 8000 si non spécifié
 */

const http = require('http');
const { v2: cloudinary } = require('cloudinary');
const { Readable } = require('stream');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { promisify } = require('util');
const Redis = require('@upstash/redis').Redis;

// Configuration
const PORT = process.argv[2] || 8000;
const RADIO_STATE_KEY = 'radio:state:v3';
const PLAYLIST_HISTORY_SIZE = 10; // Nombre de pistes à conserver dans l'historique pour éviter les répétitions
const TEMP_DIR = path.join(__dirname, '../tmp');

// Créer le dossier temporaire s'il n'existe pas
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Configuration de Redis
const redisUrl = process.env.KV_REST_API_URL || '';
const redisToken = process.env.KV_REST_API_TOKEN || '';

// Initialiser Redis
const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});

// Configuration de Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// État global du serveur de streaming
const streamState = {
  playlist: [],         // Liste complète des pistes disponibles
  currentQueue: [],     // File d'attente actuelle (pistes à venir)
  playHistory: [],      // Historique des pistes jouées récemment
  currentTrack: null,   // Piste en cours de lecture
  streamStartTime: null, // Heure de démarrage du streaming
  trackStartTime: null,  // Heure de démarrage de la piste en cours
  listeners: new Set(), // Connexions client actives
  outputStream: null,   // Flux de sortie ffmpeg
  isStreaming: false,   // État du streaming (actif/inactif)
  bitrate: 128,         // Bitrate du flux audio en kbps
  volume: 1.0           // Volume de sortie (1.0 = 100%)
};

// Classe pour gérer le streaming audio
class AudioStreamer {
  constructor() {
    this.ffmpegProcess = null;
    this.currentInputStream = null;
    this.nextTrackPrepared = false;
  }

  // Initialiser le serveur de streaming
  async initialize() {
    console.log('🎧 Initialisation du serveur de streaming audio...');
    
    try {
      // Récupérer toutes les pistes disponibles depuis Cloudinary
      await this.fetchTracksFromCloudinary();
      
      // Initialiser la file d'attente avec des pistes aléatoires
      this.shufflePlaylist();
      
      console.log(`✅ Serveur initialisé avec succès: ${streamState.playlist.length} pistes disponibles`);
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation du serveur:', error);
      return false;
    }
  }

  // Récupérer toutes les pistes depuis Cloudinary
  async fetchTracksFromCloudinary() {
    console.log('☁️ Récupération des pistes depuis Cloudinary...');
    
    try {
      // Récupérer toutes les ressources audio du dossier "web-radio/tracks"
      const result = await cloudinary.search
        .expression('resource_type:video AND folder=web-radio/tracks')
        .sort_by('public_id', 'asc')
        .max_results(500)
        .execute();
      
      if (!result || !result.resources || result.resources.length === 0) {
        throw new Error('Aucune piste trouvée sur Cloudinary');
      }
      
      // Transformer les ressources en objets de piste
      streamState.playlist = result.resources.map(resource => ({
        cloudinaryPublicId: resource.public_id,
        cloudinaryUrl: resource.secure_url,
        format: resource.format,
        duration: resource.duration || 180, // Durée par défaut si non disponible
        title: this.extractTitleFromPublicId(resource.public_id),
        artist: 'Artiste inconnu', // À remplacer par des métadonnées réelles si disponibles
        album: 'Album inconnu', // À remplacer par des métadonnées réelles si disponibles
        coverUrl: this.generateCoverUrl(resource.public_id)
      }));
      
      console.log(`📋 ${streamState.playlist.length} pistes récupérées depuis Cloudinary`);
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des pistes:', error);
      throw error;
    }
  }
  
  // Extraire un titre à partir de l'ID public Cloudinary
  extractTitleFromPublicId(publicId) {
    // Exemple: "web-radio/tracks/ma-super-chanson" -> "Ma Super Chanson"
    const filename = path.basename(publicId);
    return filename
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  // Générer une URL de couverture par défaut
  generateCoverUrl(publicId) {
    // Utiliser une image par défaut de Matrix
    return "https://res.cloudinary.com/dyom5zfbh/image/upload/v1742158676/web-radio-assets/wyzcqttcvbdhzuf3cuvn.jpg";
  }

  // Mélanger la playlist et initialiser la file d'attente
  shufflePlaylist() {
    console.log('🔀 Génération d\'une nouvelle playlist aléatoire...');
    
    // Copier la playlist
    const tracks = [...streamState.playlist];
    
    // Mélanger les pistes (algorithme de Fisher-Yates)
    for (let i = tracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tracks[i], tracks[j]] = [tracks[j], tracks[i]];
    }
    
    // Éviter de répéter les pistes récemment jouées
    const filteredTracks = tracks.filter(track => 
      !streamState.playHistory.some(historyTrack => 
        historyTrack.cloudinaryPublicId === track.cloudinaryPublicId
      )
    );
    
    // Utiliser les pistes filtrées, ou toutes les pistes si le filtre est trop restrictif
    streamState.currentQueue = filteredTracks.length > 5 ? filteredTracks : tracks;
    
    console.log(`📋 Nouvelle file d'attente générée avec ${streamState.currentQueue.length} pistes`);
  }

  // Obtenir la prochaine piste à jouer
  getNextTrack() {
    // Si la file d'attente est vide, la régénérer
    if (streamState.currentQueue.length === 0) {
      this.shufflePlaylist();
    }
    
    // Récupérer la première piste de la file d'attente
    const nextTrack = streamState.currentQueue.shift();
    
    // Ajouter la piste à l'historique
    streamState.playHistory.unshift(nextTrack);
    
    // Limiter la taille de l'historique
    if (streamState.playHistory.length > PLAYLIST_HISTORY_SIZE) {
      streamState.playHistory.pop();
    }
    
    return nextTrack;
  }

  // Démarrer le streaming audio
  async startStreaming() {
    if (streamState.isStreaming) {
      console.log('⚠️ Le streaming est déjà en cours');
      return;
    }
    
    console.log('▶️ Démarrage du streaming audio...');
    
    try {
      // Initialiser l'heure de démarrage
      streamState.streamStartTime = new Date();
      
      // Sélectionner la première piste
      streamState.currentTrack = this.getNextTrack();
      streamState.trackStartTime = new Date();
      
      // Démarrer le processus de streaming
      this.startFfmpegStreaming();
      
      // Enregistrer l'état du streaming dans Redis
      await this.updateRedisState();
      
      console.log(`🎵 Streaming démarré avec: ${streamState.currentTrack.title}`);
      streamState.isStreaming = true;
    } catch (error) {
      console.error('❌ Erreur lors du démarrage du streaming:', error);
      streamState.isStreaming = false;
    }
  }

  // Démarrer le processus ffmpeg pour le streaming audio
  startFfmpegStreaming() {
    // Créer un flux de sortie pour le streaming HTTP
    streamState.outputStream = new Readable({
      read() {} // Nécessaire pour les flux Readable
    });
    
    // Démarrer le processus ffmpeg
    this.processNextTrack();
    
    // Planifier la préparation de la piste suivante
    this.scheduleNextTrack();
  }

  // Traiter la piste actuelle avec ffmpeg
  processNextTrack() {
    const currentTrack = streamState.currentTrack;
    console.log(`▶️ Lecture de: ${currentTrack.title}`);
    
    // Télécharger temporairement le fichier pour ffmpeg
    const tempFilePath = path.join(TEMP_DIR, `${path.basename(currentTrack.cloudinaryPublicId)}.mp3`);
    
    // Télécharger le fichier avec ffmpeg
    ffmpeg(currentTrack.cloudinaryUrl)
      .outputOptions([
        `-c:a libmp3lame`,
        `-b:a ${streamState.bitrate}k`,
        `-ar 44100`,
        `-ac 2`,
        `-f mp3`,
        `-af volume=${streamState.volume}`,
      ])
      .on('start', (commandLine) => {
        console.log(`🔄 Début du traitement ffmpeg: ${currentTrack.title}`);
      })
      .on('error', (err) => {
        console.error(`❌ Erreur ffmpeg pour ${currentTrack.title}:`, err);
        // En cas d'erreur, passer à la piste suivante
        this.prepareNextTrack();
      })
      .on('end', () => {
        console.log(`✅ Fin du traitement ffmpeg: ${currentTrack.title}`);
        // Supprimer le fichier temporaire
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        
        // Si la piste suivante n'est pas déjà préparée, la préparer maintenant
        if (!this.nextTrackPrepared) {
          this.prepareNextTrack();
        }
      })
      .pipe(streamState.outputStream, { end: false });
  }

  // Planifier la préparation de la piste suivante
  scheduleNextTrack() {
    const currentTrack = streamState.currentTrack;
    const trackDuration = currentTrack.duration * 1000; // Convertir en millisecondes
    
    // Prévoir la préparation de la piste suivante légèrement avant la fin
    // de la piste actuelle (10 secondes avant ou à 80% de la durée pour les pistes courtes)
    const prepareTime = Math.min(trackDuration - 10000, trackDuration * 0.8);
    
    console.log(`⏱️ Planification de la piste suivante dans ${prepareTime/1000} secondes`);
    
    setTimeout(() => {
      this.prepareNextTrack();
    }, prepareTime);
  }

  // Préparer la piste suivante
  async prepareNextTrack() {
    if (this.nextTrackPrepared) {
      console.log('⚠️ La piste suivante est déjà préparée');
      return;
    }
    
    console.log('🔄 Préparation de la piste suivante...');
    this.nextTrackPrepared = true;
    
    // Obtenir la prochaine piste
    const nextTrack = this.getNextTrack();
    
    // Mettre à jour l'état
    const previousTrack = streamState.currentTrack;
    streamState.currentTrack = nextTrack;
    streamState.trackStartTime = new Date();
    
    // Mettre à jour l'état dans Redis
    await this.updateRedisState();
    
    console.log(`🎵 Changement de piste: ${previousTrack.title} → ${nextTrack.title}`);
    
    // Démarrer le traitement de la nouvelle piste
    this.processNextTrack();
    
    // Planifier la piste suivante
    this.scheduleNextTrack();
    
    // Réinitialiser l'indicateur
    this.nextTrackPrepared = false;
  }

  // Mettre à jour l'état du streaming dans Redis
  async updateRedisState() {
    try {
      const now = new Date();
      const elapsedTime = (now.getTime() - streamState.trackStartTime.getTime()) / 1000;
      
      // Créer l'état à stocker dans Redis
      const state = {
        isPlaying: true,
        currentTrack: streamState.currentTrack,
        position: elapsedTime,
        startTime: streamState.trackStartTime,
        tracks: [...streamState.playHistory, ...streamState.currentQueue],
        currentTrackIndex: 0,
        lastChecked: now,
        nextTracks: streamState.currentQueue.slice(0, 3) // Les 3 prochaines pistes
      };
      
      // Enregistrer dans Redis
      await redis.set(RADIO_STATE_KEY, state);
      console.log('💾 État du streaming mis à jour dans Redis');
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de l\'état Redis:', error);
    }
  }

  // Arrêter le streaming
  stopStreaming() {
    console.log('⏹️ Arrêt du streaming...');
    
    // Arrêter le processus ffmpeg s'il est en cours
    if (this.ffmpegProcess) {
      this.ffmpegProcess.kill();
      this.ffmpegProcess = null;
    }
    
    // Fermer toutes les connexions client
    for (const client of streamState.listeners) {
      client.end();
    }
    streamState.listeners.clear();
    
    // Réinitialiser l'état
    streamState.isStreaming = false;
    streamState.outputStream = null;
    
    console.log('✅ Streaming arrêté');
  }
}

// Créer et démarrer le serveur HTTP
async function startServer() {
  // Créer l'instance du streamer audio
  const audioStreamer = new AudioStreamer();
  
  // Initialiser le streamer
  const initSuccess = await audioStreamer.initialize();
  if (!initSuccess) {
    console.error('❌ Impossible de démarrer le serveur en raison d\'erreurs d\'initialisation');
    process.exit(1);
  }
  
  // Créer le serveur HTTP
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    // Route API pour obtenir l'état actuel
    if (url.pathname === '/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      
      const statusResponse = {
        currentTrack: streamState.currentTrack,
        nextTracks: streamState.currentQueue.slice(0, 3),
        listeners: streamState.listeners.size,
        isStreaming: streamState.isStreaming,
        uptime: streamState.streamStartTime ? Math.floor((new Date() - streamState.streamStartTime) / 1000) : 0,
        trackPosition: streamState.trackStartTime ? Math.floor((new Date() - streamState.trackStartTime) / 1000) : 0
      };
      
      res.end(JSON.stringify(statusResponse));
      return;
    }
    
    // Route principale pour le streaming audio
    if (url.pathname === '/stream') {
      // Vérifier si le streaming est actif
      if (!streamState.isStreaming || !streamState.outputStream) {
        res.writeHead(503, { 'Content-Type': 'text/plain' });
        res.end('Le service de streaming n\'est pas disponible actuellement');
        return;
      }
      
      // Configurer les en-têtes pour le streaming audio
      res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache, no-store',
        'Connection': 'keep-alive',
        'Transfer-Encoding': 'chunked'
      });
      
      // Ajouter le client à la liste des auditeurs
      streamState.listeners.add(res);
      console.log(`👂 Nouvel auditeur connecté (total: ${streamState.listeners.size})`);
      
      // Configurer le flux de données vers le client
      const sendAudioData = (chunk) => {
        res.write(chunk);
      };
      
      streamState.outputStream.on('data', sendAudioData);
      
      // Gérer la déconnexion du client
      req.on('close', () => {
        streamState.outputStream.removeListener('data', sendAudioData);
        streamState.listeners.delete(res);
        console.log(`👋 Auditeur déconnecté (reste: ${streamState.listeners.size})`);
      });
      
      return;
    }
    
    // Page d'accueil simple
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Serveur de Streaming Radio</title>
          <style>
            body { font-family: monospace; background: #0a0a0a; color: #00FF41; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { border-bottom: 1px solid #00FF41; padding-bottom: 10px; }
            audio { width: 100%; margin: 20px 0; }
            .info { background: #111; padding: 15px; border-radius: 5px; margin: 20px 0; }
            pre { background: #0a0a0a; padding: 10px; border-radius: 5px; overflow: auto; }
          </style>
        </head>
        <body>
          <h1>Serveur de Streaming Radio Jon</h1>
          <div class="info">
            <p>État du serveur: ${streamState.isStreaming ? '✅ En ligne' : '❌ Hors ligne'}</p>
            <p>Connectés: ${streamState.listeners.size} auditeurs</p>
            <p>Pistes disponibles: ${streamState.playlist.length}</p>
            ${streamState.currentTrack ? `<p>En cours: ${streamState.currentTrack.title}</p>` : ''}
          </div>
          
          <h2>Lecteur</h2>
          <audio controls autoplay>
            <source src="/stream" type="audio/mpeg">
            Votre navigateur ne prend pas en charge la lecture audio.
          </audio>
          
          <h2>API</h2>
          <p>Récupérer l'état actuel: <a href="/status" target="_blank">/status</a></p>
          <p>Flux audio: <a href="/stream" target="_blank">/stream</a></p>
        </body>
      </html>
    `);
  });
  
  // Démarrer le serveur HTTP
  server.listen(PORT, () => {
    console.log(`🚀 Serveur de streaming démarré sur le port ${PORT}`);
    console.log(`📡 Flux audio disponible sur: http://localhost:${PORT}/stream`);
    console.log(`ℹ️  Informations sur l'état: http://localhost:${PORT}/status`);
    console.log(`🔗 Interface Web: http://localhost:${PORT}/`);
    
    // Démarrer le streaming
    audioStreamer.startStreaming();
  });
  
  // Gérer l'arrêt propre du serveur
  process.on('SIGINT', () => {
    console.log('\n👋 Arrêt du serveur...');
    audioStreamer.stopStreaming();
    server.close(() => {
      console.log('✅ Serveur arrêté proprement');
      process.exit(0);
    });
  });
}

// Vérifier que les variables d'environnement nécessaires sont définies
if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 
    !process.env.CLOUDINARY_API_KEY || 
    !process.env.CLOUDINARY_API_SECRET) {
  console.error('❌ Erreur: Variables d\'environnement Cloudinary non définies');
  console.error('Veuillez définir NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET');
  process.exit(1);
}

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error('❌ Erreur: Variables d\'environnement Redis non définies');
  console.error('Veuillez définir KV_REST_API_URL et KV_REST_API_TOKEN');
  process.exit(1);
}

// Démarrer le serveur
startServer(); 