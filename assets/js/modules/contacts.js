// assets/js/modules/contacts.js
(function () {
  'use strict';

  /**
   * ContactsModule (Tesserati CSEN)
   * - Tabella con filtri, ricerca, selezione multipla
   * - Azioni: WhatsApp, Rinnova (datepicker, +1 anno), Elimina
   * - Azioni bulk: WA, Rinnova (datepicker), Elimina
   * - Montaggio safe con attesa storage
   */
  class ContactsModule {
    constructor() {
      this.filter = 'all'; // all | active | expiring | expired
      this.query = '';
      this.selected = new Set();
      this._mounted = false;
    }

    async init() {
      console.log('👥 [Tesserati] init');
      return true;
    }

    // ---------- UI skeleton ----------
    getPageContent() {
      return `
      <section class="page-container" style="padding:1rem">
        <div class="page-header">
          <div>
            <h1 class="page-title"><i class="fas fa-id-card"></i> Tesserati CSEN</h1>
            <p class="page-subtitle">Gestisci iscritti, rinnovi e comunicazioni</p>
          </div>
          <div class="quick-actions">
            <select id="ctFilter" class="form-control">
              <option value="all">Tutti</option>
              <option value="active">Attivi</option>
              <option value="expiring">In scadenza ≤30gg</option>
              <option value="expired">Scaduti</option>
            </select>
            <input id="ctSearch" class="form-control" placeholder="Cerca nome/telefono…"/>
          </div>
        </div>

        <div class="card" style="padding:.5rem">
          <div style="display:flex;gap:.5rem;flex-wrap:wrap;align-items:center">
            <button id="ctBulkWa" class="btn btn-outline"><i class="fab fa-whatsapp"></i> Invia WA (selezionati)</button>
            <button id="ctBulkRenew" class="btn btn-outline"><i class="fas fa-rotate"></i> Segna rinnovati</button>
            <button id="ctBulkDel" class="btn btn-danger"><i class="fas fa-trash"></i> Elimina</button>
            <span class="badge" id="ctSelCount">0 selezionati</span>
          </div>
        </div>

        <div class="card" style="margin-top:.75rem">
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th style="width:36px"><input type="checkbox" id="ctAll"/></th>
                  <th>Nome</th>
                  <th>Telefono</th>
                 
