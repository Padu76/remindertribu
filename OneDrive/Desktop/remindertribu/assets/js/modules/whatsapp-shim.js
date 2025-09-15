// assets/js/modules/whatsapp-shim.js
(function () {
  'use strict';

  // Evita doppia definizione
  if (window.__WHATSAPP_SHIM__) return;

  /**
   * Normalizza un numero in formato E.164.
   * Regole principali:
   * - Se inizia con "+" lo accetta così com'è (ripulisce spazi/punteggiatura).
   * - Se inizia con "00" -> sostituisce con "+".
   * - Se è un mobile italiano che inizia con 3 e ha 9-10 cifre -> aggiunge "+39".
   * - Se inizia con "39" e ha 10-12 cifre -> aggiunge "+" davanti.
   * - Altrimenti, prova a ripulire e se non riconosce -> null.
   */
  function normalizeE164(raw) {
    if (!raw && raw !== 0) return null;
    const s = String(raw).trim();

    // Tieni solo cifre e "+" (niente lettere/spazi)
    let digits = s.replace(/[^\d+]/g, '');

    // "+..." già internazionale
    if (digits.startsWith('+')) {
      // Rimuovi eventuali "+" extra in mezzo (capita da copy/paste)
      digits = '+' + digits.slice(1).replace(/[^\d]/g, '');
      return digits.length > 1 ? digits : null;
    }

    // "00..." -> "+..."
    if (digits.startsWith('00')) {
      const out = '+' + digits.slice(2).replace(/[^\d]/g, '');
      return out.length > 1 ? out : null;
    }

    // Solo cifre
    const just = digits.replace(/\D/g, '');

    // Mobile italiano: es. 347..., 392..., 333..., lunghezza 9-10 cifre
    if (/^3\d{8,9}$/.test(just)) {
      return `+39${just}`;
    }

    // Numero internazionale già con 39 davanti (senza "+")
    if (/^39\d{8,10}$/.test(just)) {
      return `+${just}`;
    }

    // Se è una cifra unica in stile locale (es. 10 cifre ma non inizia con 3)
    // qui NON forziamo +39: lasciamo null per non rischiare invii sbagliati.
    return null;
  }

  function openWhatsApp(phone, message) {
    const normalized = normalizeE164(phone);
    if (!normalized) {
      alert('Numero WhatsApp non valido.\nInserisci un numero mobile italiano (es. 347..., 392...) o un numero in formato internazionale.');
      return;
    }
    const text = (message && String(message).trim().length) ? String(message).trim() : 'Ciao! 👋';
    const url = `https://wa.me/${normalized.replace('+', '')}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  // Spazio globale dell’app
  window.TribuApp = window.TribuApp || {};

  // Espone l’API fallback (solo se non già presente una nativa)
  if (typeof window.TribuApp.sendWhatsAppMessage !== 'function') {
    window.TribuApp.sendWhatsAppMessage = openWhatsApp;
  }

  // Per debug rapido da console
  window.WhatsAppShim = {
    normalizeE164,
    open: openWhatsApp
  };

  window.__WHATSAPP_SHIM__ = true;
  console.log('✅ whatsapp-shim attivo (TribuApp.sendWhatsAppMessage disponibile)');
})();
