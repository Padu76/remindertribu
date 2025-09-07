// assets/js/modules/storage.js
(function () {
  'use strict';

  class TribuStorage {
    constructor() {
      this.firebase = window.Firebase_Instance || null;
      this.useFirebase = !!(window.AppConfig?.firebase?.enabled);
      this.isInitialized = false;

      this.db = null;     // Firestore DB
      this._fs = null;    // firestore functions module

      this.cache = {
        members: [],
        reminders: [],
        templates: null,
        lastSync: null
      };
    }

    async init() {
      try {
        console.log('💾 [Storage] init…');
        if (this.firebase?.init) {
          await this.firebase.init();
        }
        await Promise.allSettled([this.refreshMembers(), this.refreshReminders()]);
        this.isInitialized = true;
        console.log('✅ [Storage] initialized', { useFirebase: this.useFirebase });
        return true;
      } catch (e) {
        console.warn('⚠️ [Storage] init warn:', e);
        this.isInitialized = true;
        return true;
      }
    }

    isReady() { return this.isInitialized; }

    // --------- Firestore ensure ---------
    async _ensureDb() {
      if (!this.useFirebase) throw new Error('Firebase non abilitato');
      if (this.db && this._fs) return this.db;
      // preferisci la connessione già aperta dal tuo firebase.js
      if (window.Firebase_Instance?.db) {
        this.db = window.Firebase_Instance.db;
      } else {
        // fallback: apri usando SDK già caricato su window.Firebase + AppConfig
        const FB = window.Firebase || {};
        if (!FB.initializeApp || !FB.getFirestore) throw new Error('Firebase SDK non disponibile');
        if (!window.__RT_FIREBASE_APP) {
          try { window.__RT_FIREBASE_APP = FB.initializeApp(window.AppConfig?.firebase?.config || {}); } catch {}
        }
        this.db = FB.getFirestore(window.__RT_FIREBASE_APP);
      }
      // carica funzioni firestore
      this._fs = this._fs || await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      return this.db;
    }

    // --------- Helpers ---------
    normalizePhoneE164(raw) {
      if (!raw) return '';
      const digits = String(raw).replace(/[^\d+]/g, '');
      if (digits.startsWith('+')) return digits;
      if (digits.startsWith('00')) return '+' + digits.slice(2);
      const just = digits.replace(/\D/g, '');
      if (/^3\d{8,9}$/.test(just)) return `+39${just}`;      // 347... -> +39347...
      if (/^39\d{8,10}$/.test(just)) return `+${just}`;
      return '';
    }

    _parseDateISO(s) {
      if (!s) return null;
      if (s instanceof Date && !isNaN(s)) return s.toISOString();
      const t = String(s).trim();
      const m1 = t.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/); // dd/mm/yyyy
      if (m1) {
        const d = Number(m1[1]), mo = Number(m1[2])-1, y = Number(m1[3]);
        const dt = new Date(y, mo, d); return isNaN(dt) ? null : dt.toISOString();
      }
      const m2 = t.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/); // yyyy-mm-dd
      if (m2) {
        const y = Number(m2[1]), mo = Number(m2[2])-1, d = Number(m2[3]);
        const dt = new Date(y, mo, d); return isNaN(dt) ? null : dt.toISOString();
      }
      const dt = new Date(t); return isNaN(dt) ? null : dt.toISOString();
    }

    // --------- MEMBERS ---------
    async refreshMembers() {
      try {
        let members = [];
        if (this.useFirebase && this.firebase?.getMembers) {
          members = await this.firebase.getMembers(); // dal tuo firebase.js
        } else {
          members = this._getArrayFromLocal('tribu_tesserati');
        }

        // normalizzazione e stati
        const list = (members || []).map(m => {
          const nome = (m.nome || '').trim();
          const cognome = (m.cognome || '').trim();
          const fullName = (m.fullName || `${nome} ${cognome}`).trim();
          const dataScadenza = m.dataScadenza ? new Date(m.dataScadenza) : null;
          let daysTillExpiry = null, status = m.status || 'active';
          if (dataScadenza && !isNaN(dataScadenza)) {
            const a = new Date(); a.setHours(0,0,0,0);
            const b = new Date(dataScadenza.getFullYear(), dataScadenza.getMonth(), dataScadenza.getDate());
            daysTillExpiry = Math.ceil((b - a) / 86400000);
            status = (daysTillExpiry < 0) ? 'expired' : (daysTillExpiry <= 30) ? 'expiring' : 'active';
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
            email: (m.email || '').trim().toLowerCase(),
            tags: Array.isArray(m.tags) ? m.tags : []
          };
        });

        this.cache.members = list;
        this.cache.lastSync = new Date().toISOString();
        console.log(`[Storage] members refreshed: ${list.length}`);
        return list;
      } catch (e) {
        console.warn('refreshMembers warn:', e);
        this.cache.members = [];
        return [];
      }
    }

    getMembersCached() { return Array.isArray(this.cache.members) ? this.cache.members : []; }

    getMembers() {
      if (!this.cache.members || this.cache.members.length === 0) this.refreshMembers().catch(()=>{});
      return this.getMembersCached();
    }

    getContacts() {
      return this.getMembersCached().map(m => ({
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

    async addMember(data) {
      if (!this.useFirebase) {
        // salva in local
        const arr = this._getArrayFromLocal('tribu_tesserati');
        const id = 'tribu_' + Date.now() + '_' + Math.random().toString(36).slice(2,8);
        arr.push({ ...data, id });
        this._saveToLocal('tribu_tesserati', arr);
        await this.refreshMembers();
        return { id };
      }
      // Firestore
      await this._ensureDb();
      const { collection, addDoc } = this._fs;
      const ref = await addDoc(collection(this.db, 'members'), data);
      await this.refreshMembers();
      return { id: ref.id };
    }

    async updateMember(id, updates) {
      if (!this.useFirebase) {
        const arr = this._getArrayFromLocal('tribu_tesserati').map(x => x.id===id?{...x,...updates}:x);
        this._saveToLocal('tribu_tesserati', arr);
        await this.refreshMembers();
        return { ok: true };
      }
      await this._ensureDb();
      const { doc, setDoc } = this._fs;
      await setDoc(doc(this.db, 'members', id), updates, { merge: true });
      await this.refreshMembers();
      return { ok: true };
    }

    // --------- UPSERT FROM CSV (DEDUP) ---------
    /**
     * rows: [{nome?, cognome?, phone?, email?, dataScadenza? ISO}, ...]
     * opts: { updateExisting: boolean }
     */
    async upsertMembersFromCSV(rows, opts = {}) {
      const updateExisting = !!opts.updateExisting;

      // index esistenti
      const current = this.getMembersCached();
      const byId = new Map(current.map(m => [m.id, m]));
      const byPhone = new Map(current.map(m => [this.normalizePhoneE164(m.whatsapp || m.telefono || m.phone) || '', m]).filter(([k]) => k));
      const byEmail = new Map(current.map(m => [(m.email || '').toLowerCase(), m]).filter(([k]) => k));

      let inserted = 0, updated = 0, skipped = 0, invalids = 0;

      for (const r of rows) {
        const payload = {
          nome: (r.nome || '').toString().trim(),
          cognome: (r.cognome || '').toString().trim(),
          email: (r.email || '').toString().trim().toLowerCase() || null,
          whatsapp: this.normalizePhoneE164(r.phone || '') || null,
          dataScadenza: this._parseDateISO(r.dataScadenza) // può essere null
        };

        if (!(payload.nome || payload.cognome) || !(payload.whatsapp || payload.email)) {
          invalids++; continue;
        }

        let matchId = r.id && byId.get(r.id);
        let match = matchId || (payload.whatsapp && byPhone.get(payload.whatsapp)) || (payload.email && byEmail.get(payload.email)) || null;

        if (!match) {
          // INSERT
          await this.addMember(payload);
          inserted++;
          continue;
        }

        // MATCH TROVATO
        if (!updateExisting) { skipped++; continue; }

        // Update: solo campi non vuoti e diversi
        const patch = {};
        if (payload.nome && payload.nome !== (match.nome || '')) patch.nome = payload.nome;
        if (payload.cognome && payload.cognome !== (match.cognome || '')) patch.cognome = payload.cognome;
        if (payload.whatsapp && this.normalizePhoneE164(match.whatsapp || match.telefono || match.phone) !== payload.whatsapp) patch.whatsapp = payload.whatsapp;
        if (payload.email && (match.email || '').toLowerCase() !== payload.email) patch.email = payload.email;
        if (payload.dataScadenza && (!match.dataScadenza || new Date(match.dataScadenza).toISOString() !== payload.dataScadenza)) patch.dataScadenza = payload.dataScadenza;

        if (Object.keys(patch).length) {
          await this.updateMember(match.id, patch);
          updated++;
        } else {
          skipped++;
        }
      }

      // refresh finale
      await this.refreshMembers();

      return { inserted, updated, skipped, invalids };
    }

    // --------- REMINDERS ---------
    async refreshReminders() {
      try {
        let reminders = [];
        if (this.useFirebase && this.firebase?.getReminders) {
          reminders = await this.firebase.getReminders();
        } else {
          reminders = this._getArrayFromLocal('tribu_reminders');
        }
        this.cache.reminders = Array.isArray(reminders) ? reminders : [];
        console.log(`[Storage] reminders refreshed: ${this.cache.reminders.length}`);
        return this.cache.reminders;
      } catch (e) {
        console.warn('refreshReminders warn:', e);
        this.cache.reminders = [];
        return [];
      }
    }

    getRemindersCached() { return Array.isArray(this.cache.reminders) ? this.cache.reminders : []; }

    // --------- Templates (semplici, locali) ---------
    getTemplates() {
      try {
        if (this.cache.templates) return this.cache.templates;
        const t = this._getFromLocal('tribu_templates') || {};
        this.cache.templates = t;
        return t;
      } catch { return {}; }
    }
    saveTemplate(key, content) {
      const t = { ...this.getTemplates() };
      t[key] = content;
      this.cache.templates = t;
      this._saveToLocal('tribu_templates', t);
      return true;
    }

    // --------- Local helpers ---------
    _getArrayFromLocal(key) {
      try { const s = localStorage.getItem(key); const v = s?JSON.parse(s):[]; return Array.isArray(v)?v:[]; }
      catch { return []; }
    }
    _getFromLocal(key) {
      try { const s = localStorage.getItem(key); return s?JSON.parse(s):null; }
      catch { return null; }
    }
    _saveToLocal(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
    }
  }

  window.TribuStorage = TribuStorage;
  window.Storage_Instance = new TribuStorage();
  // per compat, aggancia allo spazio App se presente
  window.App = window.App || { modules: {} };
  window.App.modules.storage = window.Storage_Instance;
})();
