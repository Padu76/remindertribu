// assets/js/compat/whatsapp-shim.js
// Ripristina la funzione globale usata dai bottoni esistenti nei Tesserati.
// Nessuna chiave, nessun mock. Solo normalizzazione del numero e apertura wa.me.

(function () {
  'use strict';

  function normalizeE164(raw) {
    if (!raw) return null;
    const digits = String(raw).replace(/[^\d+]/g, '');
    if (digits.startsWith('+')) return digits;
    if (digits.startsWith('00')) return '+' + digits.slice(2);

    const just = digits.replace(/\D/g, '');
    // Cellulari IT (347..., 320..., ecc.): auto +39
    if (/^3\d{8,9}$/.test(just)) return `+39${just}`;
    // Numeri che iniziano già con 39 ma senza +
    if (/^39\d{8,10}$/.test(just)) return `+${just}`;
    // Altrimenti evito di aprire link errati
    return null;
  }

  function openWhatsApp(phone, message) {
    const normalized = normalizeE164(phone);
    if (!normalized) {
      // Usa i tuoi toast se disponibili, altrimenti alert
      if (window.Toast_Instance?.show) {
        window.Toast_Instance.show('Numero non valido: aggiungi prefisso internazionale (es. +39)', 'error', 4500);
      } else {
        alert('Numero non valido: aggiungi prefisso internazionale (es. +39)');
      }
      return;
    }
    const txt = message && String(message).trim().length ? message : 'Ciao! 👋';
    const url = `https://wa.me/${normalized.replace('+', '')}?text=${encodeURIComponent(txt)}`;
    window.open(url, '_blank');
  }

  // Espone l’API attesa dai bottoni legacy
  window.TribuApp = window.TribuApp || {};
  window.TribuApp.sendWhatsAppMessage = function (phone, message) {
    try {
      openWhatsApp(phone, message);
    } catch (err) {
      console.error('WhatsApp shim error:', err);
      if (window.Toast_Instance?.show) {
        window.Toast_Instance.show('Errore apertura WhatsApp', 'error', 4000);
      }
    }
  };

  console.log('✅ whatsapp-shim attivo (TribuApp.sendWhatsAppMessage disponibile)');
})();
