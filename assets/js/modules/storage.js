// assets/js/modules/storage.js
(function () {
  'use strict';

  class StorageModule {
    constructor() {
      this.cache = { members: [], reminders: [], templates: {} };
      this.isInitialized = false;
      this._retryTimer = null;

      const cfg = (window.AppConfig && (window.AppConfig.FIREBASE || window.AppConfig.firebase)) || {};
      this.useFirebase = !!(cfg.enabled || cfg.config);
    }

    async init() {
      console.log('🗃️ [Storage] init. Firebase:', this.useFirebase ? 'ON' : 'OFF');
      try {
        await this._ensureFirebaseReady();
        await this.refreshMembers();
        await this.refreshReminders().catch(() => {});
        await this.refreshTemplates().catch(() => {});
        this.isInitialized = true;
      } catch (e) {
        console.warn('⚠️ [Storage] init: Firebase non pronto, entro in modalità lazy. Motivo:', e?.message || e);
        this.isInitialized = true;
        this._lazyWaitFirebaseAndWarmup();
      }
      return true;
    }

    // ---------- PUBLIC: MEMBERS ----------
    getMembersCached() { return Array.isArray(this.cache.members) ? this.cache.members : []; }

    async refreshMembers() {
      if (!this.useFirebase) { this.cache.members = []; return this.cache.members; }
      const raw = await this._fetchMembersFromFirebase();
      const normalized = raw.map(r => this._normalizeMember(r)).filter(Boolean);
      this.cache.members = normalized;
      console.log('[Storage] members refreshed:', normalized.length);
      return normalized;
    }

    async updateMember(id, update) {
      if (!id) throw new Error('updateMember: id mancante');
      await this._updateMemberDoc(id, update);
      
      const m = this.cache.members.find(x => x.id === id);
      if (m) {
        Object.assign(m, update);
        Object.assign(m, this._normalizeMember(m));
      }
      return true;
    }

    async deleteMember(id) {
      if (!id) return false;
      await this._deleteMemberDoc(id);
      this.cache.members = this.cache.members.filter(m => m.id !== id);
      return true;
    }

    // ---------- PUBLIC: REMINDERS ----------
    getRemindersCached() { return Array.isArray(this.cache.reminders) ? this.cache.reminders : []; }

    async refreshReminders() {
      if (!this.useFirebase) { this.cache.reminders = []; return this.cache.reminders; }
      const list = await this._fetchRemindersFromFirebase();
      this.cache.reminders = Array.isArray(list) ? list : [];
      console.log('[Storage] reminders refreshed:', this.cache.reminders.length);
      return this.cache.reminders;
    }

    // ---------- PUBLIC: TEMPLATES ----------
    getTemplates() { return this.cache.templates || {}; }

    async refreshTemplates() {
      try {
        const all = await this._fetchTemplatesFromFirebase();
        if (all && typeof all === 'object') {
          this.cache.templates = all;
          console.log('[Storage] templates refreshed:', Object.keys(all).length);
        }
      } catch (e) {
        console.warn('[Storage] refreshTemplates error:', e);
      }
      return this.cache.templates;
    }

    async saveTemplate(key, tpl) {
      if (!key || !tpl || !tpl.body) throw new Error('saveTemplate: parametri mancanti');
      await this._saveTemplateDoc(key, tpl);
      this.cache.templates[key] = Object.assign({ key }, tpl, { updatedAt: new Date().toISOString() });
      return true;
    }

    // KPI rapidi (per dashboard/billing)
    async getUserStats() {
      const members = this.getMembersCached();
      return {
        members: members.length || 0,
        expiring: members.filter(m => m.status === 'expiring').length || 0,
        expired:  members.filter(m => m.status === 'expired').length || 0
      };
    }

    // ---------- PRIVATE: Firebase bridge ----------
    async _ensureFirebaseReady() {
      if (!this.useFirebase) throw new Error('Firebase disabilitato');

      if (window.FirebaseModule && window.FirebaseModule.ready) return true;

      if (window.firebase && typeof window.firebase.firestore === 'function') {
        try {
          if (window.firebase.apps && window.firebase.apps.length) return true;
        } catch (_) {}
      }

      const start = Date.now();
      while (Date.now() - start < 3000) {
        if (window.FirebaseModule && window.FirebaseModule.ready) return true;
        if (window.firebase && window.firebase.apps && window.firebase.apps.length) return true;
        await new Promise(r => setTimeout(r, 100));
      }
      throw new Error('Firebase non pronto');
    }

    async _fetchMembersFromFirebase() {
      const FB = window.FirebaseModule || {};
      if (typeof FB.getMembers === 'function') {
        const list = await FB.getMembers();
        if (Array.isArray(list)) return list;
      }
      if (window.firebase && typeof window.firebase.firestore === 'function' &&
          window.firebase.apps && window.firebase.apps.length) {
        const db = window.firebase.firestore();
        const snap = await db.collection('members').get();
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
      console.warn('[Storage] getMembers non disponibile');
      return [];
    }

    async _updateMemberDoc(id, update) {
      const FB = window.FirebaseModule || {};
      if (typeof FB.updateMember === 'function') return FB.updateMember(id, update);

      if (window.firebase && typeof window.firebase.firestore === 'function' &&
          window.firebase.apps && window.firebase.apps.length) {
        const db = window.firebase.firestore();
        await db.collection('members').doc(id).set(update, { merge: true });
        return true;
      }
      throw new Error('updateMember non disponibile');
    }

    async _deleteMemberDoc(id) {
      const FB = window.FirebaseModule || {};
      if (typeof FB.deleteMember === 'function') return FB.deleteMember(id);

      if (window.firebase && typeof window.firebase.firestore === 'function' &&
          window.firebase.apps && window.firebase.apps.length) {
        const db = window.firebase.firestore();
        await db.collection('members').doc(id).delete();
        return true;
      }
      throw new Error('deleteMember non disponibile');
    }

    async _fetchRemindersFromFirebase() {
      const FB = window.FirebaseModule || {};
      if (typeof FB.getReminders === 'function') {
        const list = await FB.getReminders();
        if (Array.isArray(list)) return list;
      }
      if (window.firebase && typeof window.firebase.firestore === 'function' &&
          window.firebase.apps && window.firebase.apps.length) {
        const db = window.firebase.firestore();
        const snap = await db.collection('reminders').get().catch(() => null);
        if (!snap) return [];
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
      return [];
    }

    async _fetchTemplatesFromFirebase() {
      const FB = window.FirebaseModule || {};
      if (typeof FB.getTemplates === 'function') return FB.getTemplates();
      if (window.firebase && typeof window.firebase.firestore === 'function' &&
          window.firebase.apps && window.firebase.apps.length) {
        const db = window.firebase.firestore();
        const snap = await db.collection('templates').get().catch(() => null);
        if (snap && !snap.empty) {
          const out = {};
          snap.forEach(d => {
            const v = d.data() || {};
            const key = d.id;
            out[key] = { key, name: v.name || key, body: v.body || '', updatedAt: v.updatedAt || null };
          });
          return out;
        }
      }
      return {};
    }

    async _saveTemplateDoc(key, tpl) {
      const FB = window.FirebaseModule || {};
      if (typeof FB.saveTemplate === 'function') return FB.saveTemplate(key, tpl);

      if (window.firebase && typeof window.firebase.firestore === 'function' &&
          window.firebase.apps && window.firebase.apps.length) {
        const db = window.firebase.firestore();
        const data = Object.assign({}, tpl, { name: tpl.name || key, updatedAt: new Date().toISOString() });
        await db.collection('templates').doc(key).set(data, { merge: true });
        return true;
      }
      throw new Error('saveTemplate non disponibile');
    }

    // ---------- LAZY RETRY ----------
    _lazyWaitFirebaseAndWarmup() {
      if (this._retryTimer) return;
      let tries = 0;
      this._retryTimer = setInterval(async () => {
        tries++;
        try {
          const ready =
            (window.FirebaseModule && window.FirebaseModule.ready) ||
            (window.firebase && window.firebase.apps && window.firebase.apps.length);
          if (ready) {
            clearInterval(this._retryTimer);
            this._retryTimer = null;
            console.log('🔄 [Storage] Firebase pronto, warmup cache…');
            await this.refreshMembers();
            await this.refreshReminders().catch(() => {});
            await this.refreshTemplates().catch(() => {});
          } else if (tries > 60) {
            clearInterval(this._retryTimer);
            this._retryTimer = null;
            console.warn('⏱️ [Storage] Firebase non è diventato pronto nei tempi previsti.');
          }
        } catch (e) {
          console.warn('⚠️ [Storage] retry error:', e?.message || e);
        }
      }, 500);
    }

    // ---------- NORMALIZZAZIONE - FIX DEFINITIVO ----------
    _normalizeMember(raw) {
      if (!raw) return null;
      const id = raw.id || raw.uid || raw._id || null;
      
      // COSTRUISCI FULLNAME CORRETTAMENTE
      let fullName = '';
      
      // Prima controlla se c'è già un fullName o nominativo
      if (raw.fullName) {
        fullName = raw.fullName;
      } else if (raw.nominativo) {
        fullName = raw.nominativo;
      } else {
        // Altrimenti combina nome e cognome
        const nome = (raw.nome || raw.name || '').trim();
        const cognome = (raw.cognome || raw.surname || raw.lastName || '').trim();
        
        // IMPORTANTE: Combina sempre nome e cognome se esistono entrambi
        if (nome && cognome) {
          fullName = `${nome} ${cognome}`;
        } else if (nome) {
          fullName = nome;
        } else if (cognome) {
          fullName = cognome;
        }
      }
      
      const phone = raw.whatsapp || raw.telefono || raw.phone || raw.cellulare || '';
      const expiryDate = this._parseAnyDate(
        raw.dataScadenza || 
        raw.scadenza || 
        raw.expiry || 
        raw.expirationDate ||
        raw.expiryDate
      );
      
      const daysTillExpiry = (expiryDate) ? this._diffInDays(expiryDate, new Date()) : null;

      let status = raw.status;
      if (!['active','expiring','expired'].includes(status)) {
        if (typeof daysTillExpiry === 'number') {
          if (daysTillExpiry < 0) status = 'expired';
          else if (daysTillExpiry <= 30) status = 'expiring';
          else status = 'active';
        } else status = 'active';
      }

      return {
        ...raw,
        id,
        fullName,  // Ora contiene nome e cognome correttamente
        nome: raw.nome,
        cognome: raw.cognome,
        whatsapp: phone,
        dataScadenza: expiryDate ? this._toYMD(expiryDate) : (raw.dataScadenza || null),
        daysTillExpiry,
        status
      };
    }

    _parseYMD(ymd) {
      if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
      const [y,m,d] = ymd.split('-').map(n=>+n);
      const dt = new Date(y, m-1, d);
      return isNaN(dt) ? null : dt;
    }

    _toYMD(d) {
      const y = d.getFullYear();
      const m = String(d.getMonth()+1).padStart(2,'0');
      const day = String(d.getDate()).padStart(2,'0');
      return `${y}-${m}-${day}`;
    }

    _parseAnyDate(val) {
      if (!val) return null;
      if (val && typeof val === 'object' && typeof val.toDate === 'function') return val.toDate();
      if (typeof val === 'number') { const d = new Date(val); return isNaN(d)?null:d; }
      if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) { const d=new Date(val); return isNaN(d)?null:d; }
      if (typeof val === 'string' && /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/.test(val)) {
        const m = val.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
        const dd=+m[1], mm=+m[2], yy=+m[3]; const d=new Date(yy,mm-1,dd); return isNaN(d)?null:d;
      }
      const d = new Date(val); return isNaN(d)?null:d;
    }

    _diffInDays(target, base) {
      const t = new Date(target.getFullYear(), target.getMonth(), target.getDate());
      const b = new Date(base.getFullYear(), base.getMonth(), base.getDate());
      return Math.round((t - b) / 86400000);
    }
  }

  // istanza globale + wiring verso App
  const instance = new StorageModule();
  window.StorageModule = instance;
  window.Storage_Instance = instance;
  window.App = window.App || { modules: {} };
  window.App.modules = window.App.modules || {};
  window.App.modules.storage = instance;
})();