/**
 * Ce script est destiné à être exécuté dans la console du navigateur
 * pour tester la progression des pistes sur le site Radio.
 * 
 * Instructions:
 * 1. Ouvrez la console du navigateur (F12 ou Ctrl+Shift+J)
 * 2. Copiez-collez ce script
 * 3. Appuyez sur Entrée pour l'exécuter
 */

(function() {
  console.log("-------------------------------------");
  console.log("🎵 Test de progression des pistes 🎵");
  console.log("-------------------------------------");

  // Fonction pour formater le temps en MM:SS
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Fonction pour obtenir l'état actuel
  async function getCurrentState() {
    try {
      const response = await fetch('/api/stream?force=true');
      if (!response.ok) throw new Error('Échec de la requête API');
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'état:', error);
      return null;
    }
  }

  // Fonction pour demander manuellement un changement de piste
  async function forceNextTrack() {
    try {
      const response = await fetch('/api/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'nextTrack' })
      });
      
      if (!response.ok) throw new Error('Échec du changement de piste');
      return await response.json();
    } catch (error) {
      console.error('Erreur lors du changement de piste:', error);
      return null;
    }
  }

  // Vérifier la progression toutes les 2 secondes
  let lastTrackId = null;
  let trackChangeCount = 0;
  
  async function checkProgress() {
    const state = await getCurrentState();
    if (!state || !state.currentTrack) {
      console.log("❌ Aucun état radio disponible");
      return;
    }
    
    const currentId = state.currentTrack.cloudinaryPublicId;
    if (lastTrackId !== null && currentId !== lastTrackId) {
      console.log(`%c🔄 CHANGEMENT DE PISTE DÉTECTÉ ! ${trackChangeCount + 1}`, 'background: #00FF41; color: black; padding: 4px; border-radius: 4px;');
      trackChangeCount++;
    }
    
    lastTrackId = currentId;
    
    console.log(`---------------------------------------------------`);
    console.log(`▶️ Lecture en cours : ${state.currentTrack.artist} - ${state.currentTrack.title}`);
    console.log(`⏱️ Position : ${formatTime(state.position)} / ${formatTime(state.currentTrack.duration)}`);
    console.log(`⏳ Restant : ${formatTime(state.remainingTime)}`);
    console.log(`🎮 Lecture : ${state.isPlaying ? '✅ Active' : '⏸️ En pause'}`);
    console.log(`---------------------------------------------------`);
  }
  
  // Démarrer la surveillance
  console.log("▶️ Démarrage de la surveillance...");
  checkProgress();
  const interval = setInterval(checkProgress, 2000);
  
  // Ajouter des commandes accessibles globalement
  window.radioTest = {
    stop: () => {
      clearInterval(interval);
      console.log("⏹️ Surveillance arrêtée");
      return "Surveillance arrêtée après " + trackChangeCount + " changements de piste détectés.";
    },
    
    nextTrack: async () => {
      console.log("⏭️ Demande de passage à la piste suivante...");
      const result = await forceNextTrack();
      if (result) {
        console.log("✅ Piste suivante demandée avec succès");
        checkProgress();
      }
      return "Demande de changement de piste envoyée.";
    },
    
    diagnose: () => {
      if (window.radioPlayer && window.radioPlayer.diagnose) {
        return window.radioPlayer.diagnose();
      } else {
        console.log("❌ Fonction de diagnostic non disponible");
        return "Fonction de diagnostic non disponible.";
      }
    }
  };
  
  console.log("-------------------------------------");
  console.log("✅ Surveillance démarrée !");
  console.log("Pour arrêter : radioTest.stop()");
  console.log("Pour passer à la piste suivante : radioTest.nextTrack()");
  console.log("Pour diagnostiquer : radioTest.diagnose()");
  console.log("-------------------------------------");
  
  return "Script de test démarré. Utilisez radioTest.stop() pour arrêter.";
})(); 