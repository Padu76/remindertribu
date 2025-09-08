// assets/js/modules/storage.js
(function () {
  'use strict';

  class TribuStorage {
    constructor() {
      this.firebase = window.Firebase_Instance || null;
      this.useFirebase = !!(window.AppConfig?.FIREBASE?.enabled);
      this.isInitialized = false;

      this.db = null;
      this._fs = null;

      this.cache = {
        members: [],
        reminders: [],
        templates: null,
        campaigns: [],
        links: [],
        lastSync: null
      };
    }

    async init() {
      try {
        if (this.firebase?.init) await this.firebase.init();
        await Promise.allSettled([
          this.refreshMembers(),
          this.refreshReminders(),
          this.refreshCampaigns(),
          this.refreshLinks()
        ]);
        this.isInitialized = true;
        console.log('✅ [Storage] initialized', { useFirebase: this.useFirebase });
      } catch (e) {
        console.warn('⚠️ [Storage] init warn:', e);
        this.isInitialized = true;
      }
      return true;
    }

    // ---------- Firestore ensure ----------
    async _ensureDb() {
      if (!this.useFirebase) throw new Error('Firebase non abilitato');
      if (this.db && this._fs) return this.db;
      if (window.Firebase_Instance?.db) {
        this.db = window.Firebase_Instance.db;
      } else {
        const FB = window.Firebase || {};
        if (!FB.initializeApp || !FB.getFirestore) throw new Error('Firebase SDK non disponibile');
        if (!window.__RT_FIREBASE_APP) window.__RT_FIREBASE_APP = FB.initializeApp(window.AppConfig?.FIREBASE?.config || {});
        this.db = FB.getFirestore(window.__RT_FIREBASE_APP);
      }
      this._fs = this._fs || await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      return this.db;
    }

    // ---------- Helpers ----------
    normalizePhoneE164(raw) {
      if (!raw) return '';
      const digits = String(raw).replace(/[^\d+]/g, '');
      if (digits.startsWith('+')) return digits;
      if (digits.startsWith('00')) return '+' + digits.slice(2);
      const just = digits.replace(/\D/g, '');
      if (/^3\d{8,9}$/.test(just)) return `+39${just}`;
      if (/^39\d{8,10}$/.test(just)) return `+${just}`;
      return '';
    }
    _parseDateISO(s) {
      if (!s) return null;
      if (s instanceof Date && !isNaN(s)) return s.toISOString();
      const t = String(s).trim();
      const m1 = t.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (m1) { const d=+m1[1], mo=+m1[2]-1, y=+m1[3]; const dt=new Date(y,mo,d); return isNaN(dt)?null:dt.toISOString(); }
      const m2 = t.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
      if (m2) { const y=+m2[1], mo=+m2[2]-1, d=+m2[3]; const dt=new Date(y,mo,d); return isNaN(dt)?null:dt.toISOString(); }
      const dt = new Date(t); return isNaN(dt)?null:dt.toISOString();
    }
    _startOfDay(d){ const x=new Date(d); x.setHours(0,0,0,0); return x; }
    _iso(d){ return (new Date(d)).toISOString(); }

    // ---------- Members ----------
    async refreshMembers() {
      try {
        let members = [];
        if (this.useFirebase && this.firebase?.getMembers) members = await this.firebase.getMembers();
        else members = this._getArrayFromLocal('tribu_tesserati');

        const list = (members||[]).map(m => {
          const nome = (m.nome||'').trim(), cognome=(m.cognome||'').trim();
          const fullName = (m.fullName || `${nome} ${cognome}`).trim();
          const d = m.dataScadenza ? new Date(m.dataScadenza) : null;
          let days = null, status='active';
          if (d && !isNaN(d)) {
            const a = this._startOfDay(new Date());
            const b = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            days = Math.ceil((b - a) / 86400000);
            status = (days < 0) ? 'expired' : (days <= 30) ? 'expiring' : 'active';
          }
          return { ...m,
            id: m.id||m.firebaseId,
            fullName,
            dataScadenza:d,
            daysTillExpiry:days,
            status,
            telefono: m.telefono||m.phone||null,
            whatsapp: m.whatsapp||m.telefono||m.phone||null,
            email: (m.email||'').trim().toLowerCase(),
            tags: Array.isArray(m.tags)?m.tags:[]
          };
        });

        this.cache.members = list;
        this.cache.lastSync = new Date().toISOString();
        console.log('[Storage] members refreshed:', list.length);
        return list;
      } catch (e) {
        console.warn('refreshMembers warn:', e);
        this.cache.members = [];
        return [];
      }
    }
    getMembersCached(){ return Array.isArray(this.cache.members)?this.cache.members:[]; }

    // ---------- Reminders ----------
    async refreshReminders() {
      try {
        let reminders = [];
        if (this.useFirebase && this.firebase?.getReminders) reminders = await this.firebase.getReminders();
        else reminders = this._getArrayFromLocal('tribu_reminders');
        this.cache.reminders = Array.isArray(reminders)?reminders:[];
        console.log('[Storage] reminders refreshed:', this.cache.reminders.length);
        return this.cache.reminders;
      } catch (e) { console.warn('refreshReminders warn:', e); this.cache.reminders=[]; return []; }
    }
    getRemindersCached(){ return Array.isArray(this.cache.reminders)?this.cache.reminders:[]; }

    // ---------- Templates ----------
    getTemplates(){ try{ if(this.cache.templates) return this.cache.templates; const t=this._getFromLocal('tribu_templates')||{}; this.cache.templates=t; return t; }catch{return{};} }
    saveTemplate(key, content){ const t={...this.getTemplates()}; t[key]=content; this.cache.templates=t; this._saveToLocal('tribu_templates',t); return true; }

    // ---------- CSV / CRUD ----------
    async addMember(data){
      if(!this.useFirebase){
        const arr=this._getArrayFromLocal('tribu_tesserati'); const id='tribu_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);
        arr.push({...data,id}); this._saveToLocal('tribu_tesserati',arr); await this.refreshMembers(); return {id};
      }
      await this._ensureDb(); const {collection,addDoc}=this._fs; const ref=await addDoc(collection(this.db,'members'),data); await this.refreshMembers(); return {id:ref.id};
    }
    async updateMember(id,updates){
      if(!this.useFirebase){
        const arr=this._getArrayFromLocal('tribu_tesserati').map(x=>x.id===id?{...x,...updates}:x);
        this._saveToLocal('tribu_tesserati',arr); await this.refreshMembers(); return {ok:true};
      }
      await this._ensureDb(); const {doc,setDoc}=this._fs; await setDoc(doc(this.db,'members',id),updates,{merge:true}); await this.refreshMembers(); return {ok:true};
    }
    async deleteMember(id){
      if(!id) return {ok:false};
      if(!this.useFirebase){
        const arr=this._getArrayFromLocal('tribu_tesserati').filter(x=>x.id!==id);
        this._saveToLocal('tribu_tesserati',arr); await this.refreshMembers(); return {ok:true};
      }
      await this._ensureDb(); const {doc,deleteDoc}=this._fs; await deleteDoc(doc(this.db,'members',id)); await this.refreshMembers(); return {ok:true};
    }
    async markMemberRenewed(id, {startDate=null}={}){
      const base = startDate ? new Date(startDate) : new Date();
      if (isNaN(base)) throw new Error('Data rinnovo non valida');
      const s = new Date(base.getFullYear(), base.getMonth(), base.getDate()); // alle 00:00
      const e = new Date(s); e.setFullYear(e.getFullYear()+1); // +1 anno netto
      const patch = {
        dataScadenza: this._iso(e),
        lastRenewalAt: this._iso(new Date()),
        status: 'active'
      };
      return this.updateMember(id, patch);
    }

    async upsertMembersFromCSV(rows, opts={}){
      const updateExisting=!!opts.updateExisting;
      const curr=this.getMembersCached();
      const byId=new Map(curr.map(m=>[m.id,m]));
      const byPhone=new Map(curr.map(m=>[this.normalizePhoneE164(m.whatsapp||m.telefono||m.phone)||'',m]).filter(([k])=>k));
      const byEmail=new Map(curr.map(m=>[(m.email||'').toLowerCase(),m]).filter(([k])=>k));
      let inserted=0,updated=0,skipped=0,invalids=0;
      for(const r of rows){
        const payload={ nome:(r.nome||'').trim(), cognome:(r.cognome||'').trim(), email:(r.email||'').trim().toLowerCase()||null,
          whatsapp:this.normalizePhoneE164(r.phone||'')||null, dataScadenza:this._parseDateISO(r.dataScadenza) };
        if(!(payload.nome||payload.cognome) || !(payload.whatsapp||payload.email)){ invalids++; continue; }
        const match = (r.id && byId.get(r.id)) || (payload.whatsapp && byPhone.get(payload.whatsapp)) || (payload.email && byEmail.get(payload.email)) || null;
        if(!match){ await this.addMember(payload); inserted++; continue; }
        if(!updateExisting){ skipped++; continue; }
        const patch={};
        if(payload.nome && payload.nome!==(match.nome||'')) patch.nome=payload.nome;
        if(payload.cognome && payload.cognome!==(match.cognome||'')) patch.cognome=payload.cognome;
        if(payload.whatsapp && this.normalizePhoneE164(match.whatsapp||match.telefono||match.phone)!==payload.whatsapp) patch.whatsapp=payload.whatsapp;
        if(payload.email && (match.email||'').toLowerCase()!==payload.email) patch.email=payload.email;
        if(payload.dataScadenza && (!match.dataScadenza || new Date(match.dataScadenza).toISOString()!==payload.dataScadenza)) patch.dataScadenza=payload.dataScadenza;
        if(Object.keys(patch).length){ await this.updateMember(match.id,patch); updated++; } else skipped++;
      }
      await this.refreshMembers();
      return {inserted,updated,skipped,invalids};
    }

    // ---------- Campaigns ----------
    async refreshCampaigns(){
      try{
        let campaigns=[];
        if(this.useFirebase){
          await this._ensureDb(); const {collection,getDocs,orderBy,query}=this._fs;
          const snap=await getDocs(query(collection(this.db,'campaigns'), orderBy('createdAt','desc')));
          campaigns = snap.docs.map(d=>({id:d.id, ...d.data()}));
        }else{
          campaigns = this._getArrayFromLocal('tribu_campaigns');
        }
        this.cache.campaigns = campaigns;
        return campaigns;
      }catch(e){ console.warn('[Storage] refreshCampaigns warn:', e); this.cache.campaigns=[]; return []; }
    }
    getCampaignsCached(){ return Array.isArray(this.cache.campaigns)?this.cache.campaigns:[]; }
    async createCampaign(payload){
      const data = { ...payload, status: payload.status||'bozza', createdAt: new Date().toISOString() };
      if(!this.useFirebase){
        const arr=this._getArrayFromLocal('tribu_campaigns'); const id='cmp_'+Date.now().toString(36); arr.unshift({id, ...data});
        this._saveToLocal('tribu_campaigns',arr); await this.refreshCampaigns(); return {id};
      }
      await this._ensureDb(); const {collection,addDoc}=this._fs; const ref=await addDoc(collection(this.db,'campaigns'), data); await this.refreshCampaigns(); return {id:ref.id};
    }

    // ---------- Links ----------
    async refreshLinks(){
      try{
        let links=[];
        if(this.useFirebase){
          await this._ensureDb(); const {collection,getDocs,orderBy,query}=this._fs;
          const snap=await getDocs(query(collection(this.db,'links'), orderBy('createdAt','desc')));
          links = snap.docs.map(d=>({id:d.id, ...d.data()}));
        }else{
          links = this._getArrayFromLocal('tribu_links');
        }
        this.cache.links = links;
        return links;
      }catch(e){ console.warn('[Storage] refreshLinks warn:', e); this.cache.links=[]; return []; }
    }
    getLinksCached(){ return Array.isArray(this.cache.links)?this.cache.links:[]; }
    async createLink({urlTarget, campaign=null}){
      const data = { urlTarget, campaign, clicks:0, createdAt:new Date().toISOString() };
      if(!this.useFirebase){
        const arr=this._getArrayFromLocal('tribu_links'); const id='l_'+Math.random().toString(36).slice(2,10); arr.unshift({id,...data});
        this._saveToLocal('tribu_links',arr); await this.refreshLinks(); return {id};
      }
      await this._ensureDb(); const {collection,addDoc}=this._fs; const ref=await addDoc(collection(this.db,'links'), data); await this.refreshLinks(); return {id:ref.id};
    }

    // ---------- Local helpers ----------
    _getArrayFromLocal(key){ try{const s=localStorage.getItem(key); const v=s?JSON.parse(s):[]; return Array.isArray(v)?v:[];}catch{return[];} }
    _getFromLocal(key){ try{const s=localStorage.getItem(key); return s?JSON.parse(s):null;}catch{return null;} }
    _saveToLocal(key,val){ try{localStorage.setItem(key, JSON.stringify(val));}catch{} }
  }

  window.TribuStorage = TribuStorage;
  window.Storage_Instance = new TribuStorage();
  window.App = window.App || { modules:{} };
  window.App.modules.storage = window.Storage_Instance;
})();
