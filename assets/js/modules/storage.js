/**
 * Storage Module - Firebase/LocalStorage Hybrid
 * Primario: Firebase (members, reminders)
 * Fallback: localStorage (nessun dato mock)
 *
 * Espone metodi SINCRONI per la UI (getContacts, getMembersCached, getRemindersCached)
 * e metodi ASINCRONI di refresh (refreshMembers, refreshReminders).
 */

(function () {
  'use strict';

  class TribuStorage {
    constructor() {
      this.firebase = window.Firebase_Instance || null;
      this.isInitialized = false;
      this.useFirebase = false;

      this.cache = {
        members: [],
        reminders: [],
        marketing: [],
        templates: null,
        lastSync: null
      };
    }

    async init() {
      try {
        console.log('💾 [Storage] init…');

        // Inizializza Firebase se disponibile e abilitato
        if (this.firebase && window.AppConfig?.firebase?.enabled) {
          const ok = await this.firebase.init();
          this.useFirebase = !!ok;
          if (ok) {
            console.log('✅ [Storage] Firebase attivo');
          } else {
            console.warn('⚠️ [Storage] Firebase non disponibile, fallback localStorage');
          }
        } else {
          console.warn('⚠️ [Storage] Firebase non configurato, uso localStorage');
        }

        // Primo caricamento cache (non blocco la UI se fallisce: mostro quello che ho)
        await Promise.allSettled([
          this.refreshMembers(),
          this.refreshReminders()
        ]);

        this.isInitialized = true;
        console.log('✅ [Storage] initialized', { useFirebase: this.useFirebase });
        return true;
      } catch (err) {
        console.error('❌ [Storage] init failed:', err);
        this.isInitialized = true; // anche se fallisce, evito di bloccare l’app
        return false;
      }
    }

    // -----------------------------
    // MEMBERS (CSEN) / CONTATTI
    // -----------------------------

    /**
     * Ricarica i membri da Firebase (o localStorage fallback) in cache.
     */
    async refreshMembers() {
      try {
        let members = [];
        if (this.useFirebase && this.firebase?.isReady()) {
          members = await this.firebase.getMembers(); // ritorna array già mappato
        } else {
          members = this._getMembersFromLocal();
        }

        // Normalizzazione campi utili alla UI
        this.cache.members = (members || []).map(m => {
          const nome = (m.nome || '').toString().trim();
          const cognome = (m.cognome || '').toString().trim();
          const fullName = (m.fullName || `${nome} ${cognome}`).trim();
          const dataScadenza = m.dataScadenza ? new Date(m.dataScadenza) : null;

          // calcolo giorni a scadenza
          let daysTillExpiry = null;
          if (dataScadenza && !isNaN(dataScadenza)) {
            const today = new Date();
            const a = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const b = new Date(dataScadenza.getFullYear(), dataScadenza.getMonth(), dataScadenza.getDate());
            daysTillExpiry = Math.ceil((b - a) / (1000 * 60 * 60 * 24));
          }

          // stato
          let status = m.status || 'active';
          if (daysTillExpiry !== null) {
            if (daysTillExpiry < 0) status = 'expired';
            else if (daysTillExpiry <= 30) status = 'expiring';
            else status = 'active';
          }

          return {
            ...m,
            id: m.id || m.firebaseId,
            fullName,
            dataScadenza,
            daysTillExpiry,
            status,
            telefono: m.telefono || m.phone || null,
            whatsapp: m.whatsapp || m.telefono || m.phone || null,
            email: m.email || null,
            tags: Array.isArray(m.tags) ? m.tags : []
          };
        });

        this.cache.lastSync = new Date().toISOString();
        console.log(`[Storage] members refreshed: ${this.cache.members.length}`);
        return this.cache.members;
      } catch (err) {
        console.error('❌ [Storage] refreshMembers failed:', err);
        this.cache.members = [];
        return [];
      }
    }

    /**
     * Getter SINCRONO: ritorna ciò che ho in cache (mai una Promise).
     */
    getMembersCached() {
      return Array.isArray(this.cache.members) ? this.cache.members : [];
    }

    /**
     * API legacy/compat: alcuni moduli chiamano getMembers() aspettandosi dati immediati.
     * Ritorno cache e avvio un refresh in background (non blocco).
     */
    getMembers() {
      // fire-and-forget refresh se la cache è vuota
      if (!this.cache.members || this.cache.members.length === 0) {
        this.refreshMembers().catch(() => {});
      }
      return this.getMembersCached();
    }

    /**
     * Contatti per UI (mappati e pronti).
     */
    getContacts() {
      const list = this.getMembersCached();
      return list.map(m => ({
        id: m.id,
        name: m.fullName || m.name || '',
        phone: m.whatsapp || m.telefono || '',
        email: m.email || '',
        tags: m.tags || [],
        status: m.status,
        dataScadenza: m.dataScadenza ? new Date(m.dataScadenza) : null,
        daysTillExpiry: m.daysTillExpiry
      }));
    }

    /**
     * Aggiorna lo stato di un membro.
     */
    async updateMemberStatus(memberId, newStatus) {
      try {
        if (this.useFirebase && this.firebase?.isReady()) {
          await this.firebase.updateMemberStatus(memberId, newStatus);
        }
        // aggiorno cache
        this.cache.members = this.getMembersCached().map(m =>
          (m.id === memberId) ? { ...m, status: newStatus, updatedAt: new Date().toISOString() } : m
        );
        // persisto anche in local come fallback
        this._saveMembersToLocal(this.cache.members);
        console.log(`✅ [Storage] member ${memberId} -> ${newStatus}`);
        return true;
      } catch (err) {
        console.error('❌ [Storage] updateMemberStatus failed:', err);
        throw err;
      }
    }

    // -----------------------------
    // REMINDERS
    // -----------------------------

    async refreshReminders() {
      try {
        let reminders = [];
        if (this.useFirebase && this.firebase?.isReady()) {
          reminders = await this.firebase.getReminders();
        } else {
          reminders = this._getArrayFromLocal(window.AppConfig?.storage?.keys?.reminders || 'tribu_reminders');
        }
        this.cache.reminders = Array.isArray(reminders) ? reminders : [];
        console.log(`[Storage] reminders refreshed: ${this.cache.reminders.length}`);
        return this.cache.reminders;
      } catch (err) {
        console.error('❌ [Storage] refreshReminders failed:', err);
        this.cache.reminders = [];
        return [];
      }
    }

    getRemindersCached() {
      return Array.isArray(this.cache.reminders) ? this.cache.reminders : [];
    }

    getReminders() {
      if (!this.cache.reminders || this.cache.reminders.length === 0) {
        this.refreshReminders().catch(() => {});
      }
      return this.getRemindersCached();
    }

    async addReminder(reminderData) {
      try {
        let newReminder;
        if (this.useFirebase && this.firebase?.isReady()) {
          newReminder = await this.firebase.addReminder(reminderData);
        } else {
          newReminder = {
            id: this._id(),
            ...reminderData,
            createdAt: new Date().toISOString(),
            status: 'scheduled'
          };
          const arr = this.getRemindersCached().slice();
          arr.push(newReminder);
          this.cache.reminders = arr;
          this._saveToLocal(window.AppConfig?.storage?.keys?.reminders || 'tribu_reminders', arr);
        }
        console.log('✅ [Storage] reminder added:', newReminder?.name || newReminder?.id);
        return newReminder;
      } catch (err) {
        console.error('❌ [Storage] addReminder failed:', err);
        throw err;
      }
    }

    // -----------------------------
    // MARKETING (placeholder solido, nessun mock)
    // -----------------------------

    async getMarketingClients() {
      if (this.useFirebase && this.firebase?.isReady() && this.firebase.getMarketingClients) {
        try {
          return await this.firebase.getMarketingClients();
        } catch {
          // se non implementato lato Firebase, ricado in local
        }
      }
      return this._getArrayFromLocal('tribu_marketing');
    }

    // -----------------------------
    // TEMPLATE (C)
    // -----------------------------
    getTemplates() {
      try {
        if (this.cache.templates && typeof this.cache.templates === 'object') {
          return this.cache.templates;
        }
        const stored = this._getFromLocal('tribu_templates');
        const base = (stored && typeof stored === 'object')
          ? stored
          : (window.AppConfig?.whatsapp?.templates || {});
        this.cache.templates = base;
        return base;
      } catch (err) {
        console.error('❌ [Storage] getTemplates failed:', err);
        return window.AppConfig?.whatsapp?.templates || {};
      }
    }

    saveTemplate(key, content) {
      try {
        const t = { ...this.getTemplates() };
        t[key] = content;
        this.cache.templates = t;
        this._saveToLocal('tribu_templates', t);
        console.log('✅ [Storage] template salvato:', key);
        return true;
      } catch (err) {
        console.error('❌ [Storage] saveTemplate failed:', err);
        return false;
      }
    }

    // -----------------------------
    // PROFILO / STATS (senza mock)
    // -----------------------------
    getUserProfile() {
      const profile = this._getFromLocal(window.AppConfig?.storage?.keys?.profile || 'tribu_profile');
      return profile && typeof profile === 'object' ? profile : {};
    }

    setUserProfile(profile = {}) {
      const safe = (profile && typeof profile === 'object') ? profile : {};
      this._saveToLocal(window.AppConfig?.storage?.keys?.profile || 'tribu_profile', safe);
      return safe;
    }

    getUserStats() {
      // calcolo base dai dati reali che ho
      const stats = this._getFromLocal(window.AppConfig?.storage?.keys?.stats || 'tribu_stats') || {};
      const computed = {
        members: this.getMembersCached().length,
        reminders: this.getRemindersCached().length,
        ...stats
      };
      return computed;
    }

    // -----------------------------
    // LOCAL HELPERS
    // -----------------------------
    _getMembersFromLocal() {
      const raw = this._getArrayFromLocal('tribu_tesserati');
      // normalizzo date/status come in refreshMembers
      return raw.map(m => ({
        ...m,
        dataScadenza: m.dataScadenza ? new Date(m.dataScadenza) : null
      }));
    }

    _saveMembersToLocal(arr) {
      const plain = (arr || []).map(m => ({
        ...m,
        dataScadenza: m.dataScadenza ? new Date(m.dataScadenza).toISOString() : null
      }));
      this._saveToLocal('tribu_tesserati', plain);
    }

    _getArrayFromLocal(key) {
      try {
        const s = localStorage.getItem(key);
        const v = s ? JSON.parse(s) : [];
        return Array.isArray(v) ? v : [];
      } catch {
        return [];
      }
    }

    _getFromLocal(key) {
      try {
        const s = localStorage.getItem(key);
        return s ? JSON.parse(s) : null;
      } catch {
        return null;
      }
    }

    _saveToLocal(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.warn(`[Storage] local save failed for ${key}`, e);
      }
    }

    _id() {
      return 'tribu_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    }

    // Stato modulo
    getConnectionStatus() {
      return {
        firebase: this.useFirebase && this.firebase?.isReady(),
        localStorage: typeof Storage !== 'undefined'
      };
    }

    isReady() {
      return this.isInitialized;
    }
  }

  // Esporta istanza globale
  window.TribuStorage = TribuStorage;
  window.Storage_Instance = new TribuStorage();
})();
