// assets/js/modules/storage.js
(function () {
  'use strict';

  /**
   * StorageModule
   * - cache locale (members / reminders / templates)
   * - integrazione Firebase/Firestore con fallback multipli
   * - normalizzazione dati e util per i moduli UI
   */
  class StorageModule {
    constructor() {
      this.cache = {
        members: [],
        reminders: [],
        templates: {}
      };
      this.isInitialized = false;

      const cfg = (window.AppConfig && window.AppConfig.FIREBASE) || {};
      this.useFirebase = !!cfg.enabled || !!cfg.config;
    }

    // ------------- INIT -------------
    async init() {
      console.log('🗃️ [Storage] init. Firebase:', this.useFirebase ? 'ON' : 'OFF');

      try {
        if (this.useFirebase) {
          await this._ensureFirebaseReady();
          await this.refreshMembers();
          await this.refreshTemplates().catch(() => {});
        }
        this.isInitialized = true;
      } catch (e) {
        console.error('❌ [Storage] init error:', e);
        this.isInitialized = true; // comunque permetti ai moduli di montare
      }
      return true;
    }

    // ------------- PUBLIC: MEMBERS -------------
    getMembersCached() {
      return Array.isArray(this.cache.members) ? this.cache.members : [];
    }

    async refreshMembers() {
      if (!this.useFirebase) {
        console.warn('[Storage] refreshMembers: Firebase disabilitato');
        this.cache.members = [];
        return this.cache.members;
      }
      const raw = await this._fetchMembersFromFirebase();
      const normalized = raw.map(r => this._normalizeMember(r)).filter(Boolean);
      this.cache.members = normalized;
      console.log('[Storage] members refreshed:', normalized.length);
      return normalized;
    }

    /**
     * Rinnova un tesserato:
     * - startDate: "YYYY-MM-DD"
     * - nuova scadenza = startDate + 1 anno (stessa data)
     */
    async markMemberRenewed(id, { startDate }) {
      if (!id) throw new Error('markMemberRenewed: id mancante');
      const start = this._parseYMD(startDate);
      if (!start) throw new Error('markMemberRenewed: startDate invalida');

      const newExpiry = new Date(start); // +1 anno
      newExpiry.setFullYear(newExpiry.getFullYear() + 1);

      const update = {
        lastRenewalAt: new Date().toISOString(),
        dataScadenza: this._toYMD(newExpiry)
      };

      await this._updateMemberDoc(id, update);

      // aggiorna cache
      const m = this.cache.members.find(x => x.id === id);
      if (m) {
        Object.assign(m, update);
        const n = this._normalizeMember(m);
        Object.assign(m, n);
      }
      return true;
    }

    async deleteMember(id) {
      if (!id) return false;
      await this._deleteMemberDoc(id);
      this.cache.members = this.cache.members.filter(m => m.id !== id);
      return true;
    }

    // ------------- PUBLIC: TEMPLATES -------------
    getTemplates() {
      return this.cache.templates || {};
    }

    async refreshTemplates() {
      try {
        const all = await this._fetchTemplatesFromFirebase(); // {key:{name,body,...}}
        if (all && typeof all === 'object') {
          this.cache.templates = all;
          console.log('[Storage] templates refreshed:', Object.keys(all).length);
        }
      } catch (e) {
        console.warn('[Storage] refreshTemplates error:', e);
      }
      return this.cache.templates;
    }

    /**
     * salva/aggiorna un template
     * @param {string} key es: 'rinnovo_csen'
     * @param {{name?:string, body:string}} tpl
     */
    async saveTemplate(key, tpl) {
      if (!key || !tpl || !tpl.body) throw new Error('saveTemplate: parametri mancanti');
      await this._saveTemplateDoc(key, tpl);
      this.cache.templates[key] = Object.assign({ key }, tpl, { updatedAt: new Date().toISOString() });
      return true;
    }

    // ------------- PRIVATE: FIREBASE BRIDGE -------------
    async _ensureFirebaseReady() {
      // se esiste un modulo firebase custom, usalo
      if (window.FirebaseModule && window.FirebaseModule.ready) return true;

      // compat global (se hai incluso sdk compat in index.html)
      if (window.firebase && (window.firebase.firestore || (window.firebase.apps && window.firebase.apps.length))) {
        return true;
      }

      // se il tuo firebase.js inizializza su window.Firebase (o simili),
      // attendi un attimo che compaia.
      const start = Date.now();
      while (Date.now() - start < 3000) {
        if (window.FirebaseModule || window.firebase) return true;
        await new Promise(r => setTimeout(r, 100));
      }
      throw new Error('Firebase non pronto');
    }

    async _fetchMembersFromFirebase() {
      // 1) Usa eventuale adattatore esposto dal tuo firebase.js
      const FB = window.FirebaseModule || window.FirebaseService || window.Firebase || {};
      if (typeof FB.getMembers === 'function') {
        const list = await FB.getMembers();
        if (Array.isArray(list)) return list;
      }
      if (typeof FB.fetchMembers === 'function') {
        const list = await FB.fetchMembers();
        if (Array.isArray(list)) return list;
      }

      // 2) Fallback: Firestore compat
      if (window.firebase && typeof window.firebase.firestore === 'function') {
        const db = window.firebase.firestore();
        const snap = await db.collection('members').get();
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }

      // 3) Estremo fallback: se qualcun altro mette i dati su window
      if (Array.isArray(window.__MEMBERS__)) return window.__MEMBERS__;

      console.warn('[Storage] nessuna via disponibile per leggere i membri');
      return [];
    }

    async _updateMemberDoc(id, update) {
      const FB = window.FirebaseModule || window.FirebaseService || window.Firebase || {};

      if (typeof FB.updateMember === 'function') {
        return FB.updateMember(id, update);
      }
      if (window.firebase && typeof window.firebase.firestore === 'function') {
        const db = window.firebase.firestore();
        await db.collection('members').doc(id).set(update, { merge: true });
        return true;
      }
      throw new Error('updateMember non disponibile');
    }

    async _deleteMemberDoc(id) {
      const FB = window.FirebaseModule || window.FirebaseService || window.Firebase || {};
      if (typeof FB.deleteMember === 'function') return FB.deleteMember(id);

      if (window.firebase && typeof window.firebase.firestore === 'function') {
        const db = window.firebase.firestore();
        await db.collection('members').doc(id).delete();
        return true;
      }
      throw new Error('deleteMember non disponibile');
    }

    async _fetchTemplatesFromFirebase() {
      // prova vari percorsi: 'templates' o 'whatsapp_templates'
      const tryCollections = async (coll) => {
        if (window.firebase && typeof window.firebase.firestore === 'function') {
          const db = window.firebase.firestore();
          const snap = await db.collection(coll).get();
          if (!snap.empty) {
            const out = {};
            snap.forEach(d => {
              const v = d.data() || {};
              const key = d.id;
              out[key] = { key, name: v.name || key, body: v.body || '', updatedAt: v.updatedAt || null };
            });
            return out;
          }
        }
        const FB = window.FirebaseModule || window.FirebaseService || window.Firebase || {};
        if (typeof FB.getTemplates === 'function') {
          const obj = await FB.getTemplates(coll);
          if (obj) return obj;
        }
        return null;
      };

      return (await tryCollections('templates')) ||
             (await tryCollections('whatsapp_templates')) ||
             {};
    }

    async _saveTemplateDoc(key, tpl) {
      const FB = window.FirebaseModule || window.FirebaseService || window.Firebase || {};
      const payload = Object.assign({}, tpl, { name: tpl.name || key, updatedAt: new Date().toISOString() });

      if (typeof FB.saveTemplate === 'function') {
        return FB.saveTemplate(key, payload);
      }

      if (window.firebase && typeof window.firebase.firestore === 'function') {
        const db = window.firebase.firestore();
        await db.collection('templates').doc(key).set(payload, { merge: true });
        return true;
      }
      throw new Error('saveTemplate non disponibile');
    }

    // ------------- NORMALIZZAZIONE -------------
    _normalizeMember(raw) {
      if (!raw) return null;
      const id = raw.id || raw.uid || raw._id || null;

      // nome
      const fullName = raw.fullName || raw.nome || raw.name || '';

      // telefono: preferisci whatsapp, poi telefono/phone
      const phone = raw.whatsapp || raw.telefono || raw.phone || '';

      // dataScadenza: accetta tanti formati
      const expiryDate = this._parseAnyDate(raw.dataScadenza || raw.expiry || raw.scadenza || raw.expirationDate);

      // giorni mancanti
      const daysTillExpiry = (expiryDate) ? this._diffInDays(expiryDate, new Date()) : null;

      // status normalizzato
      let status = raw.status;
      if (!['active','expiring','expired'].includes(status)) {
        if (typeof daysTillExpiry === 'number') {
          if (daysTillExpiry < 0) status = 'expired';
          else if (daysTillExpiry <= 30) status = 'expiring';
          else status = 'active';
        } else {
          status = 'active';
        }
      }

      return {
        ...raw,
        id,
        fullName,
        whatsapp: phone,
        dataScadenza: expiryDate ? this._toYMD(expiryDate) : (raw.dataScadenza || null),
        daysTillExpiry,
        status
      };
    }

    // ------------- DATE UTILS -------------
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

      // Firestore Timestamp
      if (val && typeof val === 'object' && typeof val.toDate === 'function') {
        return val.toDate();
      }
      // epoch millis
      if (typeof val === 'number') {
        const d = new Date(val);
        return isNaN(d) ? null : d;
      }
      // ISO
      if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
        const d = new Date(val);
        return isNaN(d) ? null : d;
      }
      // DD/MM/YYYY o DD-MM-YYYY
      if (typeof val === 'string' && /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/.test(val)) {
        const m = val.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
        const dd = +m[1], mm = +m[2], yy = +m[3];
        const d = new Date(yy, mm-1, dd);
        return isNaN(d) ? null : d;
      }
      // fallback: Date.parse
      const d = new Date(val);
      return isNaN(d) ? null : d;
    }

    _diffInDays(target, base) {
      const t = new Date(target.getFullYear(), target.getMonth(), target.getDate());
      const b = new Date(base.getFullYear(), base.getMonth(), base.getDate());
      return Math.round((t - b) / 86400000);
    }
  }

  // istanza globale
  const instance = new StorageModule();
  window.StorageModule = instance;
  window.Storage_Instance = instance;
})();
